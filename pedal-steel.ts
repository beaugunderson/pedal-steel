import * as d3 from 'd3';
import { Distance, Note } from 'tonal';
import { filter, flatten, pickBy } from 'lodash';
import { note, transpose } from '@tonaljs/tonal';
import { scale } from '@tonaljs/scale';

type NoteGroup = [number, number, string];

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

function upOneHalfStep(name: string): string {
  return Note.simplify(Distance.transpose(name, '2m') as string, false) as string;
}

// function simplify(note: string): string {
//   return Note.simplify(note, true);
// }

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

  const STRING_ROOTS = STRING_NOTES.map(notes => notes[0]);

  const STRING_NOTE_PAIRS: NoteGroup[] = flatten(
    STRING_NOTES.map((notes, string) => notes.map((name, fret) => [string + 1, fret, name]))
  ) as NoteGroup[];

  return {
    STRING_ROOTS,
    STRING_NOTE_PAIRS,
    INTERVALS
  };
}

let data = setup();

// "levenshtein chord difference", e.g. weight pedals/levers < full bar movement < grip change

const DESIRED_ASPECT = 1 / 3;

const SPECIAL_FRETS: any = [3, 5, 7, 9, 12, 12 + 3, 12 + 5, 12 + 7, 12 + 9, 12 + 12];

// #region D3 setup
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

const stringLines = svg
  .append('g')
  .attr('class', 'strings')
  .selectAll('.string')
  .data([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  .enter()
  .append('line')
  .attr('class', 'string')
  .attr('stroke-dasharray', d => (d > 5 ? '1.5' : null))
  .style('stroke-width', d => (d > 5 ? d / 2 : d / 2.75));

const intervalTexts = svg
  .append('g')
  .attr('class', 'intervals')
  .selectAll('.interval')
  .data(data.INTERVALS)
  .enter()
  .append('text')
  .attr('class', 'interval')
  .text(d => d);

const noteCircles = svg
  .append('g')
  .attr('class', 'note-circles')
  .selectAll('.note-circle')
  .data(data.STRING_NOTE_PAIRS, d => `${d[0]}-${d[2]}`);

const noteCirclesEnter = noteCircles
  .enter()
  .append('circle')
  .attr('class', 'note-circle')
  .attr('r', 15);

const noteTexts = svg
  .append('g')
  .attr('class', 'notes')
  .selectAll('.note')
  .data(data.STRING_NOTE_PAIRS, d => `${d[0]}-${d[2]}`);

const noteTextsEnter = noteTexts
  .enter()
  .append('text')
  .attr('class', 'note')
  .text(d => d[2]);
// #endregion

const xAmount = (string: number) => ([3, 6].includes(string) ? 1 : 2);

const xMovement = (d: NoteGroup) =>
  d[1] > FRETS / 2 ? fretX(d[1] + xAmount(d[0])) : fretX(d[1] - xAmount(d[0]));

function update() {
  data = setup(SETTINGS);

  const scaleInformation = scale(currentScale());
  const simplifiedScale = scaleInformation.notes.map((name: string) => Note.simplify(name, true));

  const transition = svg.transition().duration(750);

  svg
    .select('.note-circles')
    .selectAll('.note-circle')
    .data(data.STRING_NOTE_PAIRS, d => `${d[0]}-${d[2]}`)
    .join(
      enter =>
        enter
          .append('circle')
          .attr('r', 15)
          .attr('cx', xMovement)
          .attr('cy', (d: NoteGroup) => stringY(d[0]))
          .call(enter => enter.transition(transition).attr('cx', d => fretX(d[1]))),

      update =>
        update.call(update =>
          update.transition(transition).attr('cx', (d: NoteGroup) => fretX(d[1]))
        ),

      exit =>
        exit.call(exit =>
          exit
            .transition(transition)
            .attr('cx', xMovement)
            .remove()
        )
    )
    .attr('class', (d: NoteGroup) => {
      const currentNote = d[2].replace(/\d+/g, '');

      // if (SETTINGS.highlight === 'scale-notes') {
      //   return simplifiedScale.includes(note) ? 'note highlighted' : 'note dimmed';
      // }

      if (
        SETTINGS.highlight === 'scale-degree-colors' ||
        SETTINGS.highlight === 'scale-degree-names'
      ) {
        const degree = simplifiedScale.indexOf(currentNote) + 1;

        if (degree === 0) {
          return 'note-circle dimmed';
        }

        return `note-circle degree-${degree}`;
      }

      if (SETTINGS.highlight === 'chord-formula') {
        const formula = chordFormula();

        for (let i = 0; i < formula.notes.length; i++) {
          if (note(currentNote).height === formula.notes[i].height) {
            const degree = parseInt(formula.degrees[i].replace(/[^0-9]/g, ''), 10) % 7;

            return `note-circle degree-${degree}`;
          }
        }
      }

      return 'note-circle';
    });

  svg
    .select('.notes')
    .selectAll('.note')
    .data(data.STRING_NOTE_PAIRS, d => `${d[0]}-${d[2]}`)
    .join(
      enter =>
        enter
          .append('text')
          .attr('class', 'note')
          .attr('x', xMovement)
          .attr('y', (d: NoteGroup) => stringY(d[0]))
          .call(enter => enter.transition(transition).attr('x', d => fretX(d[1]))),

      update =>
        update.call(update =>
          update.transition(transition).attr('x', (d: NoteGroup) => fretX(d[1]))
        ),

      exit =>
        exit.call(exit =>
          exit
            .transition(transition)
            .attr('x', xMovement)
            .remove()
        )
    )
    .attr('class', (d: NoteGroup) => {
      const currentNote = d[2].replace(/\d+/g, '');

      if (SETTINGS.highlight === 'scale-notes') {
        return simplifiedScale.includes(currentNote) ? 'note highlighted' : 'note dimmed';
      }

      if (
        SETTINGS.highlight === 'scale-degree-colors' ||
        SETTINGS.highlight === 'scale-degree-names'
      ) {
        const degree = simplifiedScale.indexOf(currentNote) + 1;

        if (degree === 0) {
          return 'note dimmed';
        }

        return `note degree-${degree}`;
      }

      return 'note';
    })
    .text((d: NoteGroup) => {
      if (SETTINGS.highlight === 'scale-degree-names') {
        const currentNote = d[2].replace(/\d+/g, '');
        const degree = simplifiedScale.indexOf(currentNote) + 1;

        return degree !== 0 ? degree : '';
      }

      if (SETTINGS.highlight === 'scale-degree-colors') {
        const currentNote = d[2].replace(/\d+/g, '');
        const degree = simplifiedScale.indexOf(currentNote) + 1;

        return degree !== 0 ? d[2] : '';
      }

      return d[2];
    });

  intervalTexts
    .data(data.INTERVALS)
    .transition()
    .text(d => d);
}

function resize() {
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
    .attr('y1', d => stringY(d))
    .attr('x2', fretX(FRETS))
    .attr('y2', d => stringY(d));

  intervalTexts
    .attr('x', fretX(0.5))
    .attr('y', (d, i) => stringY(i + 1.5))
    .text(d => d);

  noteCirclesEnter
    .attr('cx', (d: NoteGroup) => fretX(d[1]))
    .attr('cy', (d: NoteGroup) => stringY(d[0]));

  noteTextsEnter
    .attr('x', (d: NoteGroup) => fretX(d[1]))
    .attr('y', (d: NoteGroup) => stringY(d[0]));
}

const SETTINGS = new Proxy(
  {
    A: false,
    B: false,
    C: false,
    highlight: 'nothing'
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

function value(id: string) {
  return (document.getElementById(id) as HTMLInputElement).value;
}

handle('pedal-a', 'click', () => (SETTINGS.A = !SETTINGS.A));
handle('pedal-b', 'click', () => (SETTINGS.B = !SETTINGS.B));
handle('pedal-c', 'click', () => (SETTINGS.C = !SETTINGS.C));

function currentScale() {
  const root = selected('scale') + selected('scale-modifier');
  const quality = selected('scale-quality');

  return `${root} ${quality}`;
}

const CHORD_FORMULA_MAPPING = {
  1: '1P',
  2: 'M2',
  3: 'M3',
  4: '4P',
  5: '5P',
  6: 'M6',
  7: 'M7',
  9: 'M9',
  11: 'P11',
  13: 'M13',
  b2: 'm2',
  b3: 'm3',
  b5: '5d',
  b6: 'm6',
  b7: 'm7',
  bb7: '7d',
  b9: '9d',
  b13: 'm13',
  '#5': '5A',
  '#9': '9A',
  '#11': '11A'
};

function chordFormula() {
  const formula = value('chord-formula');
  const root = value('chord-formula-root-note') + value('chord-formula-root-modifier');

  const degrees = formula
    .trim()
    .split(/\s+/g)
    .map(degree => CHORD_FORMULA_MAPPING[degree] || degree);

  const notes = degrees.map(degree => note(transpose(root, degree)));

  // console.log({ notes, formula, degrees });

  return {
    notes,
    formula,
    degrees
  };
}

handle('scale', 'change', update);
handle('scale-modifier', 'change', update);
handle('scale-quality', 'change', update);

handle('chord-formula-root-note', 'change', update);
handle('chord-formula-root-modifier', 'change', update);

handle('chord-formula', 'change', update);
handle('chord-formula', 'keyup', update);

handle('highlight', 'change', () => (SETTINGS.highlight = selected('highlight')));

resize();

window.addEventListener('resize', resize);
