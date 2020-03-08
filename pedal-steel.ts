import * as d3 from 'd3';
import { Distance, Note } from 'tonal';
import { filter, pickBy } from 'lodash';
import { scale } from '@tonaljs/scale';

const FRETS = 15;
const FRET_LIST = [];

const PADDING = 25;

for (let i = 0; i <= FRETS; i++) {
  FRET_LIST.push(i);
}

const PEDAL_EFFECTS = {
  10: { A: 2 },
  6: { B: 1 },
  5: { A: 2, C: 2 },
  4: { C: 2 },
  3: { B: 1 }
};

function indexToNote(index: number): number {
  return index + 1;
}

function upOneHalfStep(note: string): string {
  return Note.simplify(Distance.transpose(note, '2m') as string, false) as string;
}

function setup(settings = {}) {
  const STRING_TUNINGS = [
    'B2',
    'D3',
    'E3',
    'F#3',
    'G#3',
    'B3',
    'E4',
    'G#4',
    'D#4',
    'F#4'
  ].reverse();

  const activePedalNames = filter(Object.keys(pickBy(settings)), name =>
    ['A', 'B', 'C'].includes(name)
  );

  const STRING_NOTES: string[][] = [];

  for (let stringIndex = 0; stringIndex < STRING_TUNINGS.length; stringIndex++) {
    const stringNumber = indexToNote(stringIndex);
    let pedalEffect: number;

    for (const pedal of activePedalNames) {
      pedalEffect = pedalEffect ?? PEDAL_EFFECTS[stringNumber]?.[pedal];
    }

    pedalEffect = pedalEffect ?? 0;

    let currentNote: string = STRING_TUNINGS[stringIndex];

    // apply pedal transposition
    for (let i = 0; i < pedalEffect; i++) {
      currentNote = upOneHalfStep(currentNote);
    }

    STRING_NOTES[stringIndex] = [currentNote];

    for (let i = 0; i < FRETS; i++) {
      currentNote = upOneHalfStep(currentNote);
      STRING_NOTES[stringIndex].push(currentNote);
    }
  }

  const INTERVALS = [];

  for (let string = 1; string < STRING_NOTES.length; string++) {
    const a = STRING_NOTES[string - 1][0];
    const b = STRING_NOTES[string][0];

    INTERVALS.push(`${Distance.interval(b, a)}, ${Distance.semitones(b, a)}`);
  }

  return {
    STRING_NOTES,
    INTERVALS
  };
}

let data = setup();

// "levenshtein chord difference", e.g. weight pedals/levers < full bar movement < grip change

const DESIRED_ASPECT = 1 / 3;

const SPECIAL_FRETS: any = [3, 5, 7, 9, 12, 12 + 3, 12 + 5, 12 + 7, 12 + 9, 12 + 12];

const fretX = d3.scaleLinear().domain([0, FRETS]);
const stringY = d3.scaleLinear().domain([1, 10]);

const chart = document.getElementById('chart');

const svg = d3.select(chart).append('svg');

const frets = svg.append('g').attr('class', 'frets');

const fretLines = frets
  .selectAll('.fret')
  .data(FRET_LIST)
  .enter()
  .append('line')
  .attr('class', d => (d > 0 ? 'fret' : 'fret root-fret'));

const fretNumbers = frets
  .selectAll('.fret-number')
  .data(FRET_LIST)
  .enter()
  .append('text')
  .attr('class', d => (SPECIAL_FRETS.includes(d) ? 'fret-number special' : 'fret-number'))
  .text(d => d);

const strings = svg
  .append('g')
  .attr('class', 'strings')
  .selectAll('.string-group')
  .data(data.STRING_NOTES)
  .enter()
  .append('g')
  .attr('class', 'string-group');

const notes = strings
  .selectAll('.note-circle, .note')
  .data((d, i) => d.map(note => [i + 1, note]))
  .enter();

const stringLines = strings
  .selectAll('.string')
  .data((d, i) => [i])
  .enter()
  .append('line')
  .attr('class', 'string');

const intervalTexts = svg
  .append('g')
  .attr('class', 'intervals')
  .selectAll('.interval')
  .data(data.INTERVALS)
  .enter()
  .append('text')
  .attr('class', 'interval')
  .text(d => d);

const noteCircles = notes
  .selectAll('.note-circle')
  .data(d => [d])
  .enter()
  .append('circle')
  .attr('class', 'note-circle')
  .attr('r', 15);

const noteTexts = notes
  .selectAll('.note')
  .data(d => [d])
  .enter()
  .append('text')
  .attr('class', 'note')
  .text(d => d[1]);

function update() {
  data = setup(SETTINGS);

  strings.data(data.STRING_NOTES).transition();

  intervalTexts.data(data.INTERVALS).transition();

  draw();
}

function draw() {
  const WIDTH = chart.clientWidth;
  const HEIGHT = chart.clientHeight;

  fretX.range([PADDING, WIDTH - PADDING]);
  stringY.range([PADDING, Math.min(WIDTH * DESIRED_ASPECT, HEIGHT) - PADDING]);

  const scaleInformation = scale(currentScale());
  const simplifiedScale = scaleInformation.notes.map((note: string) => Note.simplify(note, true));

  svg.attr('width', WIDTH).attr('height', HEIGHT);

  fretLines
    .attr('x1', d => fretX(d))
    .attr('y1', stringY(1))
    .attr('x2', d => fretX(d))
    .attr('y2', stringY(10));

  fretNumbers.attr('x', d => fretX(d)).attr('y', stringY(10.75));

  stringLines
    .attr('x1', fretX(0))
    .attr('y1', d => stringY(d + 1))
    .attr('x2', fretX(FRETS))
    .attr('y2', d => stringY(d + 1));

  intervalTexts
    .attr('x', fretX(0.5))
    .attr('y', (d, i) => stringY(i + 1.5))
    .text(d => d);

  type NoteGroup = [number, string];

  noteCircles
    .attr('cx', (d: NoteGroup) => fretX(data.STRING_NOTES[d[0] - 1].indexOf(d[1])))
    .attr('cy', (d: NoteGroup) => stringY(d[0]));

  noteTexts
    .attr('x', (d: NoteGroup) => fretX(data.STRING_NOTES[d[0] - 1].indexOf(d[1])))
    .attr('y', (d: NoteGroup) => stringY(d[0]))
    .attr('class', (d: NoteGroup) => {
      const note = d[1].replace(/\d+/g, '');

      if (SETTINGS.highlightScaleNotes) {
        return simplifiedScale.includes(note) ? 'note highlighted' : 'note dimmed';
      }

      return 'note';
    });
}

const SETTINGS = new Proxy(
  {
    A: false,
    B: false,
    C: false,
    highlightScaleNotes: false
  },
  {
    set: (target, property, value) => {
      // eslint-disable-next-line no-param-reassign
      target[property] = value;

      update();

      return true;
    }
  }
);

function handle(id: string, type: string, handler) {
  document.getElementById(id).addEventListener(type, handler);
}

function selected(id: string) {
  return (document.getElementById(id) as HTMLSelectElement).selectedOptions[0].value;
}

handle('pedal-a', 'click', () => (SETTINGS.A = !SETTINGS.A));
handle('pedal-b', 'click', () => (SETTINGS.B = !SETTINGS.B));
handle('pedal-c', 'click', () => (SETTINGS.C = !SETTINGS.C));

function currentScale() {
  const root = selected('scale') + selected('scale-modifier');
  const quality = selected('scale-quality');

  return `${root} ${quality}`;
}

handle('scale', 'change', update);
handle('scale-modifier', 'change', update);
handle('scale-quality', 'change', update);

handle(
  'highlight-scale-notes',
  'click',
  () => (SETTINGS.highlightScaleNotes = !SETTINGS.highlightScaleNotes)
);

draw();

window.addEventListener('resize', draw);
