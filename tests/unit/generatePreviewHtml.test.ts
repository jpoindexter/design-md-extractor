import { describe, expect, it } from 'vitest';
import { generatePreviewHtml } from '../../src/generate/generatePreviewHtml.js';
import type { Evidence } from '../../src/types/evidence.js';

const evidence: Evidence = {
  version: '0.1.0',
  source: {
    primaryUrl: 'https://example.com',
    pages: [{ url: 'https://example.com', status: 'success' }],
    capturedAt: '2026-05-28T10:00:00.000Z',
  },
  viewports: [{ name: 'desktop', width: 1440, height: 1000 }],
  screenshots: [],
  tokens: {
    colors: [
      {
        name: 'Ink Black',
        value: '#111111',
        cssVariable: '--color-ink-black',
        role: 'Primary text',
        properties: ['color'],
        frequency: 8,
        sampleSelectors: ['body'],
        confidence: 'high',
      },
      {
        name: 'Brand Gold',
        value: '#c8a24a',
        cssVariable: '--color-brand-gold',
        role: 'Accent',
        properties: ['background-color'],
        frequency: 4,
        sampleSelectors: ['.button'],
        confidence: 'medium',
      },
    ],
    typography: [
      {
        role: 'heading',
        fontFamily: 'Inter',
        fallback: 'system-ui',
        fontSize: '48px',
        fontWeight: '700',
        lineHeight: '1.1',
        letterSpacing: '0',
        sampleSelectors: ['h1'],
        confidence: 'high',
      },
    ],
    spacing: [
      { name: 'Space 1', value: '8px', confidence: 'high' },
      { name: 'Space 3', value: '24px', confidence: 'medium' },
    ],
    radii: [{ name: 'Radius 1', value: '10px', confidence: 'high' }],
    shadows: [
      {
        name: 'Shadow 1',
        value: '0 8px 24px rgba(0,0,0,.18)',
        confidence: 'medium',
      },
    ],
  },
  surfaces: [
    {
      level: 0,
      name: 'Canvas',
      value: '#ffffff',
      purpose: 'Page background',
      sampleSelectors: ['body'],
      confidence: 'high',
    },
    {
      level: 1,
      name: 'Raised Panel',
      value: '#f7f4ec',
      purpose: 'Cards and panels',
      sampleSelectors: ['.card'],
      confidence: 'medium',
    },
  ],
  components: [
    {
      name: 'Primary Button',
      kind: 'button',
      role: 'Primary action',
      textSample: 'Start now',
      viewport: 'desktop',
      selector: '.button',
      count: 2,
      styles: {
        backgroundColor: '#c8a24a',
        color: '#111111',
        borderColor: '#111111',
        borderRadius: '10px',
        boxShadow: '0 8px 24px rgba(0,0,0,.18)',
        padding: '12px 18px',
      },
      bounds: { width: 128, height: 44 },
      confidence: 'high',
    },
    {
      name: 'Feature Card',
      kind: 'card',
      role: 'Content container',
      textSample: 'Plan details',
      viewport: 'desktop',
      selector: '.card',
      count: 3,
      styles: {
        backgroundColor: '#f7f4ec',
        color: '#111111',
        borderColor: '#c8a24a',
        borderRadius: '10px',
        boxShadow: '0 8px 24px rgba(0,0,0,.18)',
        padding: '24px',
      },
      bounds: { width: 320, height: 180 },
      confidence: 'medium',
    },
  ],
  layout: { density: 'comfortable' },
  imagery: { strategy: 'unknown' },
  responsive: { notes: [] },
  warnings: [],
};

describe('generatePreviewHtml', () => {
  it('includes artifact download links and a CSS token preview', () => {
    const html = generatePreviewHtml(evidence);

    expect(html).toContain('href="DESIGN.md"');
    expect(html).toContain('href="evidence.json"');
    expect(html).toContain('href="tokens.css"');
    expect(html).toContain('--color-ink-black: #111111;');
    expect(html).toContain('--space-1: 8px;');
    expect(html).toContain('--surface-canvas: #ffffff;');
    expect(html).toContain('--surface-raised-panel: #f7f4ec;');
  });

  it('skins the preview shell with generated CSS variables', () => {
    const html = generatePreviewHtml(evidence);

    expect(html).toContain('body {');
    expect(html).toContain('background: var(--preview-canvas, #ffffff);');
    expect(html).toContain('color: var(--color-ink-black);');
    expect(html).toContain(
      'font-family: var(--font-heading, system-ui, sans-serif);',
    );
    expect(html).toContain('border-radius: var(--radius-1);');
    expect(html).toContain('box-shadow: var(--shadow-1);');
    expect(html).toContain('--preview-space: var(--space-1);');
    expect(html).toContain('--preview-surface: var(--surface-raised-panel);');
  });

  it('renders extracted typography, swatches, and component examples using token styles', () => {
    const html = generatePreviewHtml(evidence);

    expect(html).toContain('<section class="type-sample"><span>heading</span>');
    expect(html).toContain(
      'class="type-line" style="font-family:var(--font-heading);',
    );
    expect(html).toContain('font-size:var(--font-size-heading);');
    expect(html).toContain('Extracted heading typography');
    expect(html).toContain(
      'class="swatch-chip" style="background:var(--color-brand-gold)"',
    );
    expect(html).toContain(
      'class="component-sample component-sample-button" style="background:var(--color-brand-gold);color:var(--color-ink-black);border-color:var(--color-ink-black);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.18);padding:12px 18px;"',
    );
    expect(html).toContain(
      'class="component-sample component-sample-card" style="background:var(--surface-raised-panel);color:var(--color-ink-black);border-color:var(--color-brand-gold);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.18);padding:24px;"',
    );
    expect(html).toContain('Start now');
  });

  it('renders a report-style UI showcase for spacing, surfaces, buttons, cards, borders, radii, and shadows', () => {
    const html = generatePreviewHtml(evidence);

    expect(html).toContain('<section class="report-section ui-showcase"');
    expect(html).toContain(
      'class="surface-sample" style="background:var(--surface-raised-panel);"',
    );
    expect(html).toContain(
      'class="token-card token-card-spacing" style="--token-value:var(--space-1);"',
    );
    expect(html).toContain(
      'class="token-card token-card-radius" style="--token-value:var(--radius-1);"',
    );
    expect(html).toContain(
      'class="token-card token-card-shadow" style="--token-value:var(--shadow-1);"',
    );
    expect(html).toContain('class="ui-button ui-button-primary"');
    expect(html).toContain(
      'style="background:var(--color-brand-gold);color:var(--color-ink-black);border-color:var(--color-ink-black);border-radius:var(--preview-radius);box-shadow:var(--preview-shadow);padding:var(--preview-space) calc(var(--preview-space) * 2);"',
    );
    expect(html).toContain(
      'class="ui-card" style="background:var(--surface-raised-panel);border-color:var(--color-brand-gold);border-radius:var(--preview-radius);box-shadow:var(--preview-shadow);padding:calc(var(--preview-space) * 3);"',
    );
  });
});
