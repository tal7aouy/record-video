window.addEventListener('DOMContentLoaded', () => {
  Notification.requestPermission()
    .then(function (permission) {
      if (permission === 'granted') {
        console.log(permission)
      } else {
        alert('failed')
      }
    })
    .catch((err) => console.log(err))
})

// set up varibale needed

const constraintObj = {
  audio: false, //audio is disable
  video: {
    facingMode: 'user', //facingMode:{exact:"user"}
    width: { min: 640, ideal: 1080, max: 1920 },
    height: { min: 480, ideal: 720, max: 1080 },
  },
}

// handle for older browser that might implement getUSerMedia in some way
if (navigator.mediaDevices === 'undefined') {
  navigator.mediaDevices = {}
  navigator.mediaDevices.enumurateDevices().then((devices) => {
    navigator.mediaDevices.getUserMedia = function (constraints) {
      let getUserMedia =
        navigator.webKitGetUserMedia || navigator.mowGetUserMedia
      if (!getUserMedia) {
        return new Promise.reject(
          new Error('getUserMedia is not implemented in this browser .')
        )
      }
      return new Promise(function (resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject)
      })
    }
  })
} else {
  navigator.mediaDevices.enumerateDevices().then((devices) => {
    devices.forEach((device) => {
      console.log(device.kind.toUpperCase(), device.label)
    })
  })
}

navigator.mediaDevices
  .getUserMedia(constraintObj)
  .then(function (mediaStreamObj) {
    // connect the media stream to the first video element
    let video = document.querySelector('video')
    if ('srcObject' in video) {
      video.srcObject = mediaStreamObj
    } else {
      // old version
      video.src = Window.URL.createObjectURL(mediaStreamObj)
    }
    video.onloadedmetadata = function (ev) {
      // show in the video element what is being captured by webcam
      video.play()
    }
    // add eventlisteners for saving video/audio
    let start = document.getElementById('start_record')
    let stop = document.getElementById('stop_record')
    let mediaRecorder = new MediaRecorder(mediaStreamObj)
    let chunks = []

    start.addEventListener('click', (ev) => {
      mediaRecorder.start()
      console.log(mediaRecorder.state)
      stop.style.opacity = '1'
      start.style.opacity = '0'
    })
    stop.addEventListener('click', (ev) => {
      mediaRecorder.stop()
      console.log(mediaRecorder.state)
      stop.style.opacity = '0'
      start.style.opacity = '1'
    })
    function showNotification() {
      let notification = new Notification('record video', {
        body: 'welcome here',
        icon: '../images/logo.png',
      })
      // setTimeout(() => {
      //   notification.close()
      // }, 4000)
    }
    function download() {
      let blob = new Blob(chunks, {
        type: 'video/mp4',
      })

      let url = URL.createObjectURL(blob)
      let link = document.createElement('a')
      document.body.appendChild(link)
      link.style.display = 'none'
      link.href = url
      let name = new Date().toUTCString()
      link.download = `${name}.mp4`
      link.click()
      window.URL.revokeObjectURL(url)
      chunks = []
      showNotification()
    }
    mediaRecorder.ondataavailable = function (ev) {
      if (ev.data.size > 0) {
        chunks.push(ev.data)
        download()
      }
    }
  })
  .catch((err) => console.log(err.name, err.message))
