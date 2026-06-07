'use client';
import { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

export function CameraCapture({ onCapture }: { onCapture: (file: File) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [open, setOpen] = useState(false);
  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    streamRef.current = stream; setOpen(true);
    setTimeout(()=>{ if(videoRef.current) videoRef.current.srcObject = stream; }, 50);
  }
  function stop(){ streamRef.current?.getTracks().forEach(t=>t.stop()); streamRef.current=null; setOpen(false); }
  function capture(){
    const video=videoRef.current; if(!video) return;
    const canvas=document.createElement('canvas'); canvas.width=video.videoWidth; canvas.height=video.videoHeight;
    canvas.getContext('2d')?.drawImage(video,0,0);
    canvas.toBlob(blob=>{ if(blob){ onCapture(new File([blob], `camera-${Date.now()}.jpg`, { type:'image/jpeg' })); stop(); } }, 'image/jpeg', .92);
  }
  return <>
    <button type="button" className="neo-btn-muted" onClick={start}><Camera size={16}/>Kamera</button>
    {open && <div className="fixed inset-0 z-[80] bg-black/90 p-4"><button className="neo-btn-muted mb-3" onClick={stop}><X size={16}/>Tutup</button><video ref={videoRef} autoPlay playsInline className="mx-auto max-h-[70vh] rounded-3xl"/><button className="neo-btn mt-4 w-full" onClick={capture}>Ambil Foto</button></div>}
  </>;
}
