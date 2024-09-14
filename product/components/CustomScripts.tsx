import { useEffect, useState } from 'react'

const CustomScripts: React.FC = () => {
  const [scripts, setScripts] = useState<string>('')

  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const res = await fetch('/api/get-scripts')
        const data = await res.json()
        setScripts(data.scripts)
      } catch (error) {
        console.error('Error fetching custom scripts:', error)
      }
    }
    fetchScripts()
  }, [])

  return <script dangerouslySetInnerHTML={{ __html: scripts }} />
}

export default CustomScripts