export function playBeep() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)
    
    // Suara "beep" kasir (frekuensi 1000Hz, gelombang kotak/sine)
    oscillator.type = 'sine'
    oscillator.frequency.value = 1200 
    
    // Volume kecil
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.01)
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15)
    
    oscillator.start(audioCtx.currentTime)
    oscillator.stop(audioCtx.currentTime + 0.15)
  } catch (e) {
    console.warn("Audio Context not supported or failed", e)
  }
}
