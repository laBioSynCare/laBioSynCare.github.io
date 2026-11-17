import { chromium } from 'playwright'
import { mkdir, copyFile, stat } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import path from 'node:path'

const out = path.resolve('services/sstim-mcp-remote/public/review/sstim-mcp-walkthrough.mp4')
const dir = path.resolve('/tmp/sstim-review-video')
await mkdir(dir,{recursive:true})
const browser = await chromium.launch({ headless:true, args:['--no-sandbox'] })
const context = await browser.newContext({
  viewport: { width:1280,height:720 },
  deviceScaleFactor:1,
  recordVideo:{dir, size:{width:1280,height:720}},
})
const page = await context.newPage()
page.on('console',m=>{if(m.type()==='error')console.error('BROWSER:',m.text())})
page.on('pageerror',e=>console.error('PAGE:',e.message))
const site='https://sstim-mcp.netlify.app/review/'
let reached=false
for(let tries=0;tries<12;tries++){
  try{
    await page.goto(site,{waitUntil:'domcontentloaded',timeout:20000})
    reached=(await page.title()).includes('MCP Live Review Walkthrough')
    if(reached)break
  }catch(e){console.log('Waiting for Netlify publication',e.message)}
  await new Promise(r=>setTimeout(r,7000))
}
if(!reached)throw new Error('The live review demonstration is not yet deployed at '+site)
console.log('Live demonstration loaded:',site)
await page.waitForTimeout(2000)
for(let i=0;i<9;i++){
  await page.locator('#next').click()
  await page.waitForFunction(()=>window.__demoDone===true,null,{timeout:40000})
  const status=await page.locator('#case-state').innerText()
  const title=await page.locator('#heading').innerText()
  console.log('Scenario',i+1,title,status)
  if(!status.startsWith('PASS'))throw Error('Live MCP demonstration failed at '+title+': '+status)
  await page.waitForTimeout(i===8?2800:1750)
}
const video=page.video()
await context.close()
await browser.close()
const videoPath=await video.path()
execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',videoPath,'-c:v','libx264','-pix_fmt','yuv420p','-preset','medium','-crf','27','-movflags','+faststart',out],{stdio:'inherit'})
const size=await stat(out)
if(size.size<10000||size.size>45_000_000)throw Error('Unexpected video file size '+size.size)
console.log('CREATED_REVIEW_RECORDING',out,size.size)
