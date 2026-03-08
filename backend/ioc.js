/* ============================================================
   ioc.js – Shared Socket.IO instance container.
   Allows route handlers to emit to all connected Socket.IO
   servers (main + optional admin) without circular imports.
   ============================================================ */

const _ios = [];

/** Register a Socket.IO server instance. */
function addIo(io) {
  if (io && !_ios.includes(io)) _ios.push(io);
}

/** Emit an event on all registered Socket.IO servers. */
function emit(event, data) {
  for (const io of _ios) {
    try { io.emit(event, data); } catch (_) {}
  }
}

module.exports = { addIo, emit };
