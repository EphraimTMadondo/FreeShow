// ----- FreeShow -----
// Respond to messages from the frontend

import { app, Display, screen } from "electron"
import os from "os"
import path from "path"
import { closeMain, getScreens, loadFonts, mainWindow, maximizeMain, openURL, setGlobalMenu, toApp } from ".."
import { BIBLE, MAIN, SHOW } from "../../types/Channels"
import { closeServers, startServers } from "../servers"
import { Message } from "./../../types/Socket"
import { createPDFWindow, exportProject, exportTXT } from "./export"
import { checkShowsFolder, getDocumentsFolder, getPaths, loadFile, readFile, selectFilesDialog, selectFolderDialog } from "./files"
import { importShow } from "./import"
import { getMidiInputs, getMidiOutputs, receiveMidi, sendMidi } from "./midi"

// IMPORT
export function startImport(_e: any, msg: Message) {
    let files: string[] = selectFilesDialog(msg.data)

    if ((os.platform() === "linux" && msg.channel === "pdf") || (msg.data.extensions && !files.length)) return
    importShow(msg.channel, files || null)
}

// EXPORT
export function startExport(_e: any, msg: Message) {
    if (msg.channel !== "GENERATE") return

    let path: string = msg.data.path

    if (!path) {
        path = selectFolderDialog()
        if (!path) return
        toApp(MAIN, { channel: "EXPORT_PATH", data: path })
    }

    if (msg.data.type === "pdf") createPDFWindow(msg.data)
    else if (msg.data.type === "txt") exportTXT(msg.data)
    else if (msg.data.type === "project") exportProject(msg.data)
}

// BIBLE
export function loadScripture(e: any, msg: Message) {
    let p: string = path.resolve(app.getPath("documents"), "FreeShow", "Bibles", msg.name + ".fsb")
    let bible: any = loadFile(p, msg.id)

    // pre v0.5.6
    if (bible.error) p = path.resolve(app.getPath("documents"), "Bibles", msg.name + ".fsb")
    bible = loadFile(p, msg.id)

    e.reply(BIBLE, bible)
}

// SHOW
export function loadShow(e: any, msg: Message) {
    let p: string = checkShowsFolder(msg.path || "")
    p = path.resolve(p, msg.name + ".show")
    let show: any = loadFile(p, msg.id)

    e.reply(SHOW, show)
}

// MAIN
const mainResponses: any = {
    GET_OS: (): any => ({ platform: os.platform(), name: os.hostname() }),
    GET_SYSTEM_FONTS: (): void => loadFonts(),
    VERSION: (): string => app.getVersion(),
    URL: (data: string) => openURL(data),
    START: (data: any): void => startServers(data),
    STOP: (): void => closeServers(),
    IP: (): any => os.networkInterfaces(),
    LANGUAGE: (data: any): void => setGlobalMenu(data.strings),
    SHOWS_PATH: (): string => getDocumentsFolder(),
    EXPORT_PATH: (): string => getDocumentsFolder(null, "Exports"),
    READ_SAVED_CACHE: (data: any): string => readFile(path.resolve(getDocumentsFolder(null, "Saves"), data.id + ".json")),
    DISPLAY: (): boolean => false,
    GET_MIDI_OUTPUTS: (): string[] => getMidiOutputs(),
    GET_MIDI_INPUTS: (): string[] => getMidiInputs(),
    GET_SCREENS: (): void => getScreens(),
    GET_WINDOWS: (): void => getScreens("window"),
    GET_DISPLAYS: (): Display[] => screen.getAllDisplays(),
    GET_PATHS: (): any => getPaths(),
    OUTPUT: (_: any, e: any): "true" | "false" => (e.sender.id === mainWindow?.webContents.id ? "false" : "true"),
    CLOSE: (): void => closeMain(),
    MAXIMIZE: (): void => maximizeMain(),
    MAXIMIZED: (): boolean => !!mainWindow?.isMaximized(),
    MINIMIZE: (): void => mainWindow?.minimize(),
    FULLSCREEN: (): void => mainWindow?.setFullScreen(!mainWindow?.isFullScreen()),
    SEND_MIDI: (data: any): void => {
        sendMidi(data)
    },
    RECEIVE_MIDI: (data: any): void => {
        console.log("LISTEN TO MIDI IN", data)
        receiveMidi(data)
    },
}

export function receiveMain(e: any, msg: Message) {
    let data: any = msg
    if (mainResponses[msg.channel]) data = mainResponses[msg.channel](msg.data, e)

    if (data !== undefined) e.reply(MAIN, { channel: msg.channel, data })
}
