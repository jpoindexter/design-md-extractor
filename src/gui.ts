#!/usr/bin/env node
import { startGuiServer } from './gui/server.js';

const port = Number.parseInt(process.env.PORT ?? '4317', 10);
const host = process.env.HOST ?? '127.0.0.1';

startGuiServer({ port, host });
