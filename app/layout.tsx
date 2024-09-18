import { ChakraProvider } from '@chakra-ui/react'
import theme from '../theme'
import { AuthProvider } from '../context/AuthContext'
import { SiteInfoProvider } from '../pages/api/SiteInfoContext'

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
            <SiteInfoProvider>
              {children}
            </SiteInfoProvider>
          </AuthProvider>
        </ChakraProvider>
      </body>
    </html>
  )
}