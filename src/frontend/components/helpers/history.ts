import { uid } from "uid"
import { GetShow } from "./get"
import { shows, activeProject, projects, redoHistory, mediaFolders, projectView, folders, openedFolders } from "./../../stores"
import type { ShowRef, Project, Folder } from "./../../../types/Projects"
import { undoHistory } from "../../stores"
import { get } from "svelte/store"
import type { Slide, Item } from "../../../types/Show"

export type HistoryPages = "drawer" | "shows" | "edit"
export interface History {
  id: string
  oldData?: any
  newData?: any
  location?: {
    page: HistoryPages
    show?: ShowRef
    layout?: string
    slide?: string
    item?: number
  }
}
export function history(obj: History, undo: null | boolean = null) {
  // if (undo) {
  //   let tempObj = obj
  //   obj.newData = tempObj.oldData
  //   obj.oldData = tempObj.newData
  // }

  // let page: HistoryPages = obj.location?.page || "shows"
  if (!obj.location) obj.location = { page: "shows" }
  if (!obj.oldData) obj.oldData = null
  if (!obj.newData) obj.newData = null

  // console.log(obj)

  switch (obj.id) {
    // style
    case "textStyle":
    case "deleteItem":
    case "itemStyle":
      shows.update((s) => {
        let items: Item[] = GetShow(obj.location?.show!).slides[obj.location?.slide!].items
        obj.newData.forEach((item: Item, i: number) => {
          items[i] = item
        })
        // items.forEach(item => {
        //   item = obj.newData
        // });
        // GetShow(obj.location.show!).slides[obj.location.slide!].items[obj.location.item!] = obj.newData
        return s
      })
      break
    case "slideStyle":
      shows.update((s) => {
        let slide: Slide = GetShow(obj.location?.show!).slides[obj.location?.slide!]
        slide.style = obj.newData
        return s
      })
      break
    // move
    case "project": // projecList
      projects.update((p) => {
        p[get(activeProject)!].shows = obj.newData
        return p
      })
      break
    // new
    case "newMediaFolder":
      mediaFolders.update((mf) => {
        if (obj.newData.data === null) {
          // remove folder
          delete mf[obj.newData.id]
        } else mf[obj.newData.id] = obj.newData.data
        return mf
      })
      break
    case "newProject":
      if (typeof obj.newData === "string") {
        projects.update((p) => {
          delete p[obj.newData]
          return p
        })
        if (get(activeProject) === obj.newData) {
          activeProject.set(null)
          projectView.set(true)
        }
      } else {
        let project: Project = obj.newData
        let id: string = obj.oldData
        if (obj.newData === null) {
          project = { name: "unnamed", created: new Date(), parent: get(projects)[get(activeProject)!]?.parent || "/", shows: [] }
          id = uid()
          obj.newData = project
          obj.oldData = id
          // TODO: edit name...
        }
        projects.update((p) => {
          p[id] = project
          return p
        })
        activeProject.set(id)
      }
      break
    case "newFolder":
      if (typeof obj.newData === "string") {
        folders.update((p) => {
          delete p[obj.newData]
          return p
        })
        if (get(openedFolders).includes(obj.newData)) {
          openedFolders.update((of) => {
            return of.filter((id) => id !== obj.newData)
          })
        }
      } else {
        let folder: Folder = obj.newData
        let id: string = obj.oldData
        if (obj.newData === null) {
          folder = { name: "unnamed", parent: id || get(folders)[get(projects)[get(activeProject)!]?.parent]?.parent || "/" }
          id = uid()
          obj.newData = folder
          obj.oldData = id
          // TODO: edit name...
        }
        openedFolders.update((f) => {
          if (!f.includes(folder.parent)) f.push(folder.parent)
          f.push(id)
          console.log(f)
          return f
        })
        folders.update((p) => {
          p[id] = folder
          return p
        })
      }
      break

    default:
      console.log(obj)
      break
  }

  if (undo === null) redoHistory.set([])

  if (undo) {
    redoHistory.update((rh: History[]) => {
      rh.push(obj)
      return rh
    })
  } else {
    undoHistory.update((uh: History[]) => {
      // if id and location is equal push new data to previous stored
      // not: project | newProject | newFolder
      if (
        undo === null &&
        uh[uh.length - 1]?.id === obj.id &&
        JSON.stringify(Object.values(uh[uh.length - 1]?.location!)) === JSON.stringify(Object.values(obj.location!)) &&
        obj.id !== "project" &&
        obj.id !== "newProject" &&
        obj.id !== "newFolder"
      ) {
        uh[uh.length - 1].newData = obj.newData
      } else uh.push(obj)
      return uh
    })
  }
  console.log("UNDO: ", [...get(undoHistory)])
  console.log("REDO: ", [...get(redoHistory)])

  // TODO: go to location
}

export const undo = () => {
  if (get(undoHistory).length) {
    let lastUndo: History
    undoHistory.update((uh: History[]) => {
      lastUndo = uh.pop()!
      return uh
    })

    let oldData: any = lastUndo!.oldData
    lastUndo!.oldData = lastUndo!.newData
    lastUndo!.newData = oldData

    history(lastUndo!, true)
  }
}

export const redo = () => {
  if (get(redoHistory).length) {
    let lastRedo: History
    redoHistory.update((rh: History[]) => {
      lastRedo = rh.pop()!
      return rh
    })

    let oldData: any = lastRedo!.oldData
    lastRedo!.oldData = lastRedo!.newData
    lastRedo!.newData = oldData

    history(lastRedo!, false)
  }
}

// {
//   action: "moveSlide",
//   fromState: 2,
//   page: "shows",
// },
