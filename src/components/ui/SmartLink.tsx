import { Link } from 'react-router'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { isExternal } from '../../lib/content'

type Props = { href: string; children: ReactNode } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>

/** Uses client-side routing for internal links and a normal anchor for external ones. */
export function SmartLink({ href, children, ...rest }: Props) {
  if (isExternal(href)) {
    const newTab = /^(https?:)?\/\//.test(href)
    return (
      <a href={href} {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>
        {children}
      </a>
    )
  }
  return (
    <Link to={href} {...rest}>
      {children}
    </Link>
  )
}
