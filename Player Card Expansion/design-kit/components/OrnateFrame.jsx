// OrnateFrame — wraps content in the gold 9-slice ornate frame.
// Requires: design-kit/theme.css + ornate-ui.css imported once at app root.
//
//   <OrnateFrame>…panel content…</OrnateFrame>
//   <OrnateFrame as="section" className="my-extra">…</OrnateFrame>
//
import React from 'react'

export default function OrnateFrame({ as: Tag = 'div', className = '', children, ...rest }) {
  return (
    <Tag className={('oui-frame ' + className).trim()} {...rest}>
      {children}
    </Tag>
  )
}
