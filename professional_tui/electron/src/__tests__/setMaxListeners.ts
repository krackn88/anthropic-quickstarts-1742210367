import { EventEmitter } from 'events';

// Increase the default limit of event listeners to prevent warnings
EventEmitter.defaultMaxListeners = 20;

// Also set for the process object specifically
process.setMaxListeners(20);
