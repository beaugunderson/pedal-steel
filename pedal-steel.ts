import * as d3 from 'd3';
import { Distance, Note } from 'tonal';

const FRETS = 20;
const FRET_LIST = [];

for (let i = 0; i <= FRETS; i++) {
  FRET_LIST.push(i);
}

const STRING_TUNINGS = ['B2', 'D3', 'E3', 'F#3', 'G#3', 'B3', 'E4', 'G#4', 'D#4', 'F#4'].reverse();

const STRING_NOTES: string[][] = [];

const PADDING = 25;

for (let note = 0; note < STRING_TUNINGS.length; note++) {
  let currentNote: string = STRING_TUNINGS[note];

  STRING_NOTES[note] = [currentNote];

  for (let i = 0; i < FRETS; i++) {
    currentNote = Note.simplify(Distance.transpose(currentNote, '2m') as string, false) as string;
    STRING_NOTES[note].push(currentNote);
  }
}

const INTERVALS = [];

for (let note = 1; note < STRING_TUNINGS.length; note++) {
  const a = STRING_TUNINGS[note - 1];
  const b = STRING_TUNINGS[note];

  INTERVALS.push(`${Distance.interval(b, a)}, ${Distance.semitones(b, a)}`);
}

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
  .data(STRING_NOTES)
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
  .data(INTERVALS)
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

function draw() {
  const WIDTH = chart.clientWidth;
  const HEIGHT = chart.clientHeight;

  fretX.range([PADDING, WIDTH - PADDING]);
  stringY.range([PADDING, Math.min(WIDTH * DESIRED_ASPECT, HEIGHT) - PADDING]);

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

  intervalTexts.attr('x', fretX(0.5)).attr('y', (d, i) => stringY(i + 1.5));

  noteCircles
    .attr('cx', d => fretX(STRING_NOTES[d[0] - 1].indexOf(d[1])))
    .attr('cy', d => stringY(d[0]));

  noteTexts
    .attr('x', d => fretX(STRING_NOTES[d[0] - 1].indexOf(d[1])))
    .attr('y', d => stringY(d[0]));
}

draw();

window.addEventListener('resize', draw);
