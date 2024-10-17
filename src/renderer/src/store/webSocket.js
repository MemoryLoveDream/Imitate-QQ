import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUserStore } from './user'
import { useComponentsStore } from './components'
import { SignalType } from './constants'

export const useWebSocketStore = defineStore('ws', () => {
  const userStore = useUserStore()
  const componentsStore = useComponentsStore()
  const ws = ref()
  const peerId = ref()
  const othersPeerId = ref()

  async function webSocketOnMessage(e) {
    let signal = JSON.parse(e.data)
    console.log(e.data)
    if (signal.signalType === SignalType.SEND_CHAT) {
      let chat = JSON.parse(signal.content)
      delete chat.receiverId
      await componentsStore.addChat(chat.messageType, chat.senderId, chat)
    } else if (signal.signalType === SignalType.REQUEST_PEER_ID) {
      await window.api.createChild('video_call', 700, 680, '/video_call')
      sendSignal({ signalType: SignalType.SEND_PEER_ID, content: `${peerId.value}` })
    } else if (signal.signalType === SignalType.SEND_PEER_ID) {
      othersPeerId.value = signal.content
    }
  }

  function initWebSocket() {
    ws.value = new WebSocket('ws://localhost:8888/ws')
    ws.value.onmessage = webSocketOnMessage
    ws.value.onopen = () =>
      sendSignal({
        signalType: SignalType.FIRST_CONNECTION,
        content: `${userStore.currentUser.id}`
      })
    ws.value.onerror = () => console.log('后端没开！')
    ws.value.onclose = () => console.log('断开连接！')
    window.addEventListener('beforeunload', function () {
      sendSignal({ signalType: SignalType.DISCONNECTION, content: `${userStore.currentUser.id}` })
      ws.value.close()
    })
  }

  function sendSignal(object) {
    ws.value.send(JSON.stringify(object))
  }

  function sendMessage(object) {
    sendSignal({ signalType: SignalType.SEND_CHAT, content: JSON.stringify(object) })
  }

  return {
    peerId,
    othersPeerId,
    initWebSocket,
    sendSignal,
    sendMessage
  }
})
