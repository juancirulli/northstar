import "./globals.css";

// Lo que aparece en la pestaña del navegador y en buscadores.
export const metadata = {
  title: "Northstar",
  description: "Tu sistema operativo personal.",
};

// Marco que envuelve toda la app.
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
