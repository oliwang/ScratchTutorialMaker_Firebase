"use client"

import * as React from "react"

// Don't import scratchblocks directly - we'll load it dynamically
// import scratchblocks from "scratchblocks"

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  blockStyle?: 'scratch3'
  languages?: string[]
}

const ScratchBlocks: React.FunctionComponent<Props> = ({
  blockStyle,
  languages,
  children,
  ...props
}) => {
  const ref = React.useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = React.useState(false)

  // Mark component as client-side only
  React.useEffect(() => {
    setIsClient(true)
  }, [])

  React.useEffect(() => {
    if (!isClient || !ref.current) return

    const renderBlocks = async () => {
      try {
        // Dynamically import scratchblocks only on the client
        const scratchblocks = (await import("scratchblocks")).default
        
        let options: any = {}
        if (blockStyle !== undefined) options.style = 'scratch3'
        if (languages !== undefined) options.languages = languages

        const doc = scratchblocks.parse(String(children || ''), options)
        const svg = scratchblocks.render(doc, options)

        if (ref.current) {
          ref.current.innerHTML = ""
          ref.current.appendChild(svg)
        }
      } catch (error) {
        console.error("Error rendering scratch blocks:", error)
      }
    }

    renderBlocks()
  }, [blockStyle, languages, children, isClient])

  // Return placeholder on server, real component on client
  if (!isClient) {
    return <div ref={ref} {...props} className={`${props.className || ''} bg-muted/20 p-2 rounded`} />
  }

  return <div ref={ref} {...props} />
}

export default ScratchBlocks