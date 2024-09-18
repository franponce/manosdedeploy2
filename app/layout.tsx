import { ChakraProvider } from '@chakra-ui/react'
import theme from '../theme'
import { AuthProvider } from '../context/AuthContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ChakraProvider theme={theme}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ChakraProvider>
      </body>
    </html>
  )
}