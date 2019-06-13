import { EventEmitter } from 'events'
import webrtcSwarm from 'webrtc-swarm'
import  signalhub from 'signalhub'

class Session extends EventEmitter {

  constructor(sessionId, uuid, isFollower = false) {
    super()

    const self = this;

    async function init() {
      self.sessionId = sessionId

      let options = {}

      if (!isFollower) {
        const constraints = {audio: true, video: true}
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        const video = document.querySelector('video');
        video.muted = true;
        video.srcObject = stream;
        options = {
          stream: stream,
          offerConstraints: {
            mandatory: {
              OfferToReceiveAudio: true,
              OfferToReceiveVideo: true
            }
          }
        }
      }

      options.uuid = uuid;

      const hub = signalhub(self.sessionId, [
        process.env.SIGNALHUB_URL
      ])

      const sw = webrtcSwarm(hub, options)

      sw.on('peer', (peer, peerId) => {

        peer.on('stream', (stream) => {
          const video = document.querySelector('video');
          video.srcObject = stream;
        })

        self.emit('session.new_peer_appeared', peer, peerId)
      })

      sw.on('disconnect', (peer, peerId) => {
        self.emit('session.peer_disconnected', peer, peerId)
      })

      setImmediate(() => {
        self.emit('session.ready', self.sessionId)
      })
    }

    init().then()
  }
}

export default Session
