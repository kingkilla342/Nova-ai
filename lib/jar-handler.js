import JSZip from 'jszip';

// ═══════════════════════════════════════════
// JAR IMPORT (DECOMPILE)
// JARs are ZIP files. We extract resources,
// read class structure, and let AI regenerate source.
// ═══════════════════════════════════════════

const TEXT_EXTENSIONS = [
  '.yml', '.yaml', '.json', '.properties', '.toml', '.xml',
  '.txt', '.md', '.cfg', '.conf', '.lang', '.mcmeta', '.mcfunction',
  '.gradle', '.bat', '.sh', '.mf',
];

const SKIP_PATHS = [
  'META-INF/MANIFEST.MF',
  'META-INF/maven/',
  'META-INF/services/',
];

export async function importJar(file) {
  const zip = await JSZip.loadAsync(file);
  const result = {
    resources: {},       // text files we can read directly
    classes: [],         // .class file paths (for structure analysis)
    pluginYml: null,     // parsed plugin.yml content
    bungeeYml: null,     // parsed bungee.yml if exists
    mainClass: null,     // main class from plugin.yml
    packageName: null,   // detected package
    pluginName: null,    // plugin name
    version: null,       // plugin version
    apiVersion: null,    // MC api-version
    dependencies: [],    // depend/softdepend from plugin.yml
    commands: [],        // commands from plugin.yml
    permissions: [],     // permissions from plugin.yml
  };

  for (const [path, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue;
    if (SKIP_PATHS.some(s => path.startsWith(s))) continue;

    const ext = '.' + path.split('.').pop().toLowerCase();

    if (path.endsWith('.class')) {
      // Convert path to class name: com/example/Plugin.class → com.example.Plugin
      const className = path.replace(/\.class$/, '').replace(/\//g, '.');
      result.classes.push({
        path,
        className,
        package: className.split('.').slice(0, -1).join('.'),
        simpleName: className.split('.').pop(),
      });
    } else if (TEXT_EXTENSIONS.includes(ext)) {
      try {
        const content = await zipEntry.async('string');
        result.resources[path] = content;

        // Parse plugin.yml
        if (path === 'plugin.yml' || path.endsWith('/plugin.yml')) {
          result.pluginYml = content;
          result.mainClass = extractYmlValue(content, 'main');
          result.pluginName = extractYmlValue(content, 'name');
          result.version = extractYmlValue(content, 'version');
          result.apiVersion = extractYmlValue(content, 'api-version');

          // Extract commands
          const cmdSection = extractYmlSection(content, 'commands');
          if (cmdSection) {
            result.commands = Object.keys(parseSimpleYml(cmdSection));
          }

          // Extract dependencies
          const depend = extractYmlValue(content, 'depend');
          const softdepend = extractYmlValue(content, 'softdepend');
          if (depend) result.dependencies.push(...depend.replace(/[\[\]]/g, '').split(',').map(s => s.trim()));
          if (softdepend) result.dependencies.push(...softdepend.replace(/[\[\]]/g, '').split(',').map(s => s.trim()));
        }

        if (path === 'bungee.yml' || path.endsWith('/bungee.yml')) {
          result.bungeeYml = content;
        }
      } catch {
        // Skip binary/unreadable files
      }
    }
  }

  // Detect package from main class or class paths
  if (result.mainClass) {
    result.packageName = result.mainClass.split('.').slice(0, -1).join('.');
  } else if (result.classes.length > 0) {
    result.packageName = result.classes[0].package;
  }

  return result;
}

// Simple YAML value extractor (no full parser needed)
function extractYmlValue(yml, key) {
  const match = yml.match(new RegExp(`^${key}:\\s*['"]?(.+?)['"]?\\s*$`, 'm'));
  return match ? match[1].trim() : null;
}

function extractYmlSection(yml, key) {
  const lines = yml.split('\n');
  let inSection = false;
  let section = '';
  for (const line of lines) {
    if (line.match(new RegExp(`^${key}:`))) {
      inSection = true;
      continue;
    }
    if (inSection) {
      if (line.match(/^\S/) && line.trim()) break; // next top-level key
      section += line + '\n';
    }
  }
  return section || null;
}

function parseSimpleYml(section) {
  const result = {};
  const lines = section.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s{2}(\w+):/);
    if (match) result[match[1]] = true;
  }
  return result;
}

// ═══════════════════════════════════════════
// BUILD PROJECT FILES FROM JAR ANALYSIS
// Places resources in proper project structure
// ═══════════════════════════════════════════

export function buildProjectFromJar(jarData) {
  const files = {};

  // Place all resource files in src/main/resources/
  for (const [path, content] of Object.entries(jarData.resources)) {
    files[`src/main/resources/${path}`] = content;
  }

  // Generate build.gradle
  const javaVersion = jarData.apiVersion ? (parseFloat(jarData.apiVersion) >= 1.20 ? 17 : parseFloat(jarData.apiVersion) >= 1.17 ? 17 : 11) : 17;
  const spigotVersion = jarData.apiVersion ? `${jarData.apiVersion}.4-R0.1-SNAPSHOT` : '1.20.4-R0.1-SNAPSHOT';

  files['build.gradle'] = `plugins {
    id 'java'
    id 'com.github.johnrengelman.shadow' version '8.1.1'
}

group = '${jarData.packageName || 'com.example'}'
version = '${jarData.version || '1.0.0'}'

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(${javaVersion})
    }
}

repositories {
    mavenCentral()
    maven { url 'https://hub.spigotmc.org/nexus/content/repositories/snapshots/' }
    maven { url 'https://oss.sonatype.org/content/repositories/snapshots' }
}

dependencies {
    compileOnly 'org.spigotmc:spigot-api:${spigotVersion}'
}

shadowJar {
    archiveClassifier.set('')
}

build.dependsOn shadowJar`;

  files['settings.gradle'] = `rootProject.name = '${jarData.pluginName || 'ImportedPlugin'}'`;

  return {
    files,
    summary: {
      name: jarData.pluginName,
      mainClass: jarData.mainClass,
      packageName: jarData.packageName,
      version: jarData.version,
      apiVersion: jarData.apiVersion,
      classCount: jarData.classes.length,
      resourceCount: Object.keys(jarData.resources).length,
      commands: jarData.commands,
      dependencies: jarData.dependencies,
      classes: jarData.classes,
    },
  };
}

// ═══════════════════════════════════════════
// PROJECT EXPORT (COMPILE-READY ZIP)
// Bundles all project files into a downloadable
// ZIP with proper Gradle structure
// ═══════════════════════════════════════════

export async function exportProject(files, projectName) {
  const zip = new JSZip();
  const root = zip.folder(projectName || 'nova-project');

  // Add all project files
  for (const [path, content] of Object.entries(files)) {
    root.file(path, content);
  }

  // Add gradlew scripts if not present
  if (!files['gradlew']) {
    root.file('gradlew', GRADLEW_SCRIPT);
    root.file('gradlew.bat', GRADLEW_BAT);
  }

  // Add .gitignore if not present
  if (!files['.gitignore']) {
    root.file('.gitignore', `build/\n.gradle/\n*.jar\n*.class\n.idea/\n*.iml\nout/\n`);
  }

  // Add README
  root.file('README.md', `# ${projectName || 'Nova Project'}

Built with [Nova AI Mod Creator](https://nova-ai.vercel.app)

## How to Build

### Option 1: Command Line
\`\`\`bash
./gradlew build
\`\`\`
The compiled .jar will be in \`build/libs/\`

### Option 2: IntelliJ IDEA
1. Open this folder as a project
2. Let Gradle sync
3. Run the \`build\` task

### Option 3: GitHub Actions (Auto-Build)
Push this to a GitHub repo and add this workflow file at \`.github/workflows/build.yml\`:

\`\`\`yaml
name: Build Plugin
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      - run: chmod +x gradlew
      - run: ./gradlew build
      - uses: actions/upload-artifact@v4
        with:
          name: plugin-jar
          path: build/libs/*.jar
\`\`\`
`);

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  return blob;
}

// Minimal gradlew script
const GRADLEW_SCRIPT = `#!/bin/sh
echo "Gradle wrapper not included. Install Gradle or run: gradle wrapper"
echo "Then re-run ./gradlew build"
`;

const GRADLEW_BAT = `@echo off
echo Gradle wrapper not included. Install Gradle or run: gradle wrapper
echo Then re-run gradlew.bat build
`;

// ═══════════════════════════════════════════
// DOWNLOAD HELPER
// ═══════════════════════════════════════════

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
