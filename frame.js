// {{{ Debugging crap

function log (obj) {
  if (typeof obj === 'string') {
    obj = { m: obj }
  }
  obj.id = id
  // Console prints <unavailable> under common conditions due to e10s.
  // content.console.log("frame", obj)
  // WTF: If I use sendSyncMessage, a bunch of extra frame scripts seem to get generated.
  sendAsyncMessage('keyboard@cmcaine.co.uk:console', obj)
} // }}}

// {{{ Helper functions

function pick (o, ...props) {
  return Object.assign({}, ...props.map(prop => ({[prop]: o[prop]})))
}

// Shallow copy of keyevent.
function shallowKeyboardEvent (ke) {
  let shallow = pick(
    ke,
    'shiftKey', 'metaKey', 'altKey', 'ctrlKey', 'repeat', 'key',
    'bubbles', 'composed', 'defaultPrevented', 'eventPhase',
    'timeStamp', 'type', 'isTrusted'
  )
  shallow.target = pick(ke.target, 'tagName')
  shallow.target.ownerDocument = pick(ke.target.ownerDocument, 'URL')
  return shallow
} // }}}

function keydownHandler (event) {
  // Suppress events, if requested
  if (preventDefault) {
    event.preventDefault()
  }
  if (stopPropagation) {
    event.stopPropagation()
  }

  // Send to chrome
  // Second argument is .data and can only contain js native stuff that can be sent inter-process.
  // Third argument is .objects and every element will be CPOW'd. Don't use that: CPOW is slow and will be disabled.
  sendAsyncMessage('keyboard@cmcaine.co.uk:keydown', {
    event: shallowKeyboardEvent(event)
  }
    // { event }
  )
}

function messageHandler (message) {
  // sendAsyncMessage("keyboard@cmcaine.co.uk:console", {id: id, str: message.data.command});
  log(message.data.command)
  switch (message.data.command) {
    case 'unload': unload(); break
    case 'suppress': suppress(message); break
  }
}

function load () {
  addMessageListener('keyboard@cmcaine.co.uk:to_frame_scripts', messageHandler)
  addEventListener('keydown', keydownHandler, false)
  // sendAsyncMessage("keyboard@cmcaine.co.uk:console", {up: id});
  log('up')
}

function unload () {
  removeEventListener('keydown', keydownHandler)
  removeMessageListener('keyboard@cmcaine.co.uk:to_frame_scripts', messageHandler)
  // This message is not guaranteed to be received because the console listener is likely to be pulled down too.
  // sendAsyncMessage("keyboard@cmcaine.co.uk:console", {down: id});
  log('down')
}

function suppress (message) {
  if ('preventDefault' in message.data) {
    preventDefault = message.data.preventDefault
  }
  if ('stopPropagation' in message.data) {
    stopPropagation = message.data.stopPropagation
  }
  // sendAsyncMessage("keyboard@cmcaine.co.uk:console", {data: message.data, preventDefault, stopPropagation});
  log({preventDefault, stopPropagation})
}

// Frame state

let preventDefault = false
let stopPropagation = false
let id = Math.ceil(Math.random() * 1000)

load()
