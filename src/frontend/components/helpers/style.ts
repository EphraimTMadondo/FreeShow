import type { StringObject } from "./../../../types/Main"
export const getStyles = (str: string | null | undefined, removeText: boolean = false) => {
  let styles: StringObject = {}
  if (str?.length) {
    str.split(";").forEach((s) => {
      if (s.length) {
        let style: string = s.slice(s.indexOf(":") + 1, s.length).trim()
        if (removeText && style.length > style.replace(/\D+/g, "").length) style = style.replace(/\D.+/g, "")
        styles[s.slice(0, s.indexOf(":")).trim()] = style
      }
    })
  }
  return styles
}