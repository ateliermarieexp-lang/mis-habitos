export const metadata = {
  title: 'MisHábitos',
  description: 'Tu tracker de hábitos personal con IA',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0F0F1A" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#0F0F1A' }}>
        {children}
      </body>
    </html>
  )
}
