(function(){
  const card = document.getElementById('card');
  const inpVpa = document.getElementById('inp-vpa');
  const inpName = document.getElementById('inp-name');
  const inpAmount = document.getElementById('inp-amount');
  const inpPurpose = document.getElementById('inp-purpose');
  const btnGenerate = document.getElementById('btn-generate');
  const btnClear = document.getElementById('btn-clear');
  const qrSlot = document.getElementById('qr-slot');
  const btnDownload = document.getElementById('btn-download');
  const btnShare = document.getElementById('btn-share');

  let qrcodeInstance = null;
  let currentDataURL = '';

  function validVPA(v){
    return /^[a-zA-Z0-9._\-]{2,256}@[a-zA-Z]{3,64}$/.test((v||'').trim());
  }

  function buildURI(){
    const vpa = inpVpa.value.trim();
    const pn = inpName.value.trim();
    const am = inpAmount.value.trim();
    const tn = inpPurpose.value.trim();
    const params = new URLSearchParams();
    params.set('pa', vpa);
    if (pn) params.set('pn', pn);
    if (am) params.set('am', am);
    if (tn) params.set('tn', tn);
    params.set('cu','INR');
    return 'upi://pay?'+params.toString();
  }

  function updateGenerateState(){
    const v = inpVpa.value.trim();
    const a = inpAmount.value.trim();
    const amountOk = a.length===0 || (!isNaN(Number(a)) && Number(a) >= 0);
    btnGenerate.disabled = !(validVPA(v) && amountOk);
  }

  function generateAndFlip(){
    qrSlot.innerHTML = '';
    const uri = buildURI();
    qrcodeInstance = new QRCode(qrSlot, { text: uri, width: 300, height: 300, correctLevel: QRCode.CorrectLevel.H });

    setTimeout(()=>{
      const img = qrSlot.querySelector('img');
      const canvas = qrSlot.querySelector('canvas');
      if (img && img.src) currentDataURL = img.src;
      else if (canvas) currentDataURL = canvas.toDataURL('image/png');
      else currentDataURL = '';
    },120);

    card.classList.add('flipped');
  }

  function clearForm(){
    inpVpa.value = '';
    inpName.value = '';
    inpAmount.value = '';
    inpPurpose.value = '';
    qrSlot.innerHTML = '';
    currentDataURL = '';
    card.classList.remove('flipped');
    updateGenerateState();
  }

  async function downloadQR(){
    if (!currentDataURL) { alert('Generate the QR first.'); return; }
    try{
      const res = await fetch(currentDataURL);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'upi-qr.png'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }catch(e){ alert('Download failed — try opening the image then saving it.'); }
  }

  async function shareQR(){
    if (!currentDataURL) { alert('Generate the QR first.'); return; }
    try{
      if (navigator.canShare) {
        const res = await fetch(currentDataURL);
        const blob = await res.blob();
        const file = new File([blob],'upi-qr.png',{type:blob.type});
        if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'UPI QR', text: 'Scan to pay' }); return; }
      }
    }catch(e){ }

    try{
      if (navigator.clipboard && window.ClipboardItem) {
        const res = await fetch(currentDataURL);
        const blob = await res.blob();
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        alert('QR image copied to clipboard — paste into chat or apps.');
        return;
      }
    }catch(e){ }

    window.open(currentDataURL, '_blank');
  }

  inpVpa.addEventListener('input', updateGenerateState);
  inpAmount.addEventListener('input', updateGenerateState);
  inpName.addEventListener('input', updateGenerateState);
  inpPurpose.addEventListener('input', updateGenerateState);

  btnGenerate.addEventListener('click', generateAndFlip);
  btnClear.addEventListener('click', clearForm);
  btnDownload.addEventListener('click', downloadQR);
  btnShare.addEventListener('click', shareQR);

  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') card.classList.remove('flipped'); });
  document.querySelector('.back').addEventListener('click', function(e){ if (e.target.closest('.icon-btn')) return; card.classList.remove('flipped'); });

  updateGenerateState();
})();