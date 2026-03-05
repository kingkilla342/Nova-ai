import './globals.css';

export const metadata = {
  title: 'NOVA — AI Mod Creator',
  description: 'AI-powered Minecraft Java Edition mod, plugin, and datapack creator',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="scanlines">{children}</body>
    </html>
  );
}
