import './globals.css';

export const metadata = {
  title: 'Nova — AI Mod Creator',
  description: 'AI-powered Minecraft Java Edition mod, plugin, and datapack creator',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-nova-bg text-nova-text font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
