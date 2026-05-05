export const metadata = {
  title: 'MisHábitos',
  description: 'Tu tracker de hábitos personal con IA',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0F0F1A" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#0F0F1A' }}>
        {children}
      </body>
    </html>
  )
}
