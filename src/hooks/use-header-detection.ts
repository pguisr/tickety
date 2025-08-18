import { useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export const useHeaderDetection = () => {
  const location = useLocation()
  const { user } = useAuth()

  // Páginas que nunca têm header
  const pagesWithoutHeader = ['/auth', '/404']
  
  // Páginas que têm header condicionalmente baseado na autenticação
  const conditionalHeaderPages = ['/checkout', '/event']
  
  // Verifica se a página atual não tem header
  const isPageWithoutHeader = pagesWithoutHeader.some(path => 
    location.pathname === path || location.pathname.startsWith(path)
  )

  // Verifica se é uma página condicional e se tem header
  const isConditionalPage = conditionalHeaderPages.some(path => 
    location.pathname.startsWith(path)
  )

  // Determina se tem header
  const hasHeader = !isPageWithoutHeader && (
    !isConditionalPage || // Páginas normais sempre têm header se não estão na lista de exclusão
    (isConditionalPage && (user || location.pathname.startsWith('/event'))) // Páginas condicionais têm header se logado ou é página de evento
  )

  return { hasHeader }
}
