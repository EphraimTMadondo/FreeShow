<script lang="ts">
  import { activeShow, outBackground, mediaOptions, outLocked } from "../../../stores"
  import SelectElem from "../../system/SelectElem.svelte"
  import Card from "../Card.svelte"
  import IntersectionObserver from "./IntersectionObserver.svelte"
  import MediaLoader from "./MediaLoader.svelte"

  export let name: string
  export let path: string
  export let type: any
  // export let size: number
  $: name = name.slice(0, name.lastIndexOf("."))

  export let activeFile: null | number
  export let allFiles: string[]

  let loaded: boolean = type === "image"
  let videoElem: any
  let hover: boolean = false
  let duration: number = 0

  function move(e: any) {
    if (loaded && videoElem) {
      let percentage: number = e.offsetX / e.target.offsetWidth
      let steps: number = 10

      // let time = duration * percentage
      let time = duration * ((Math.floor(percentage * steps) * steps + steps) / 100)
      if (Number(time) === time) videoElem.currentTime = time
    }
  }

  let index: number = allFiles.findIndex((a) => a === path)

  // let clicked: boolean = false
  // let doubleClick: boolean = false
  function click(e: any) {
    // if (!clicked) {
    //   clicked = true
    //   setTimeout(() => {
    // if (!doubleClick)
    // activeShow.set({ id: path, name, type })
    if (!e.ctrlKey) activeFile = index
    //   else doubleClick = false
    //   clicked = false
    // }, 501)
    // }
  }
  $: if (activeFile !== null && allFiles[activeFile] === path) activeShow.set({ id: path, name, type })

  function dblclick(e: any) {
    if (!e.ctrlKey && !$outLocked) outBackground.set({ path: path })
    // doubleClick = true
  }
</script>

<Card
  {loaded}
  class="context #media_card"
  style="width: {$mediaOptions.grid ? 100 : 100 / $mediaOptions.columns}%;"
  preview={$activeShow?.id === path}
  active={$outBackground?.path === path}
  label={name}
  icon={type === "video" ? "movie" : "image"}
  white={type === "image"}
  on:click={click}
  on:dblclick={dblclick}
  on:mouseenter={() => (hover = true)}
  on:mouseleave={() => (hover = false)}
  on:mousemove={move}
>
  <SelectElem id="media" data={{ name, path }} draggable fill>
    <IntersectionObserver class="observer" once let:intersecting>
      {#if intersecting}
        <MediaLoader bind:loaded bind:hover bind:duration bind:videoElem {type} {path} {name} />
      {/if}
      <!-- ({formatBytes(size)}) -->
    </IntersectionObserver>
  </SelectElem>
</Card>