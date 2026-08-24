// Generates a .docx copy of a single CAR that matches the real CAR Template Blank.docx
// (city seal top-left, "City of Franklin" / "Council Agenda Report" right-aligned with a
// bottom rule under the second line, then the date) — extracted directly from that
// template file rather than guessed. Runs entirely client-side via the isomorphic `docx`
// package; Packer.toBlob() works in the browser (Packer.toBuffer() is Node-only).
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, BorderStyle, WidthType, AlignmentType } from 'docx'
import { CAR_FIELD_GUIDANCE } from './carGuidance'

const PAGE_WIDTH_DXA = 12240 // US Letter, portrait
const PAGE_HEIGHT_DXA = 15840
const MARGIN_DXA = 1440 // 1 inch
const CONTENT_WIDTH_DXA = PAGE_WIDTH_DXA - MARGIN_DXA * 2

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER }

function formatDate(dateStr) {
  const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date()
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

async function loadSealImage() {
  const res = await fetch('/city-seal.png')
  return await res.arrayBuffer()
}

function heading(text) {
  return new Paragraph({ spacing: { before: 200, after: 60 }, children: [new TextRun({ text, bold: true, font: 'Calibri' })] })
}

function body(text) {
  return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: text || '—', font: 'Calibri' })] })
}

export async function generateCarDocx(car, meetingDate) {
  const sealBuffer = await loadSealImage()

  const headerTable = new Table({
    width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: [1440, CONTENT_WIDTH_DXA - 1440],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 1440, type: WidthType.DXA },
            borders: NO_BORDERS,
            children: [new Paragraph({ children: [new ImageRun({ data: sealBuffer, transformation: { width: 80, height: 81 }, type: 'png' })] })],
          }),
          new TableCell({
            width: { size: CONTENT_WIDTH_DXA - 1440, type: WidthType.DXA },
            borders: NO_BORDERS,
            children: [
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'City of Franklin', bold: true, smallCaps: true, size: 32, font: 'Calibri' })] }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                border: { bottom: { style: BorderStyle.SINGLE, size: 4, space: 1, color: '000000' } },
                children: [new TextRun({ text: 'Council Agenda Report', bold: true, smallCaps: true, size: 32, font: 'Calibri' })],
              }),
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatDate(meetingDate), font: 'Calibri' })] }),
            ],
          }),
        ],
      }),
    ],
  })

  const children = [headerTable, new Paragraph({ text: '' })]

  for (const [key, field] of Object.entries(CAR_FIELD_GUIDANCE)) {
    children.push(heading(`${field.label}:`))
    if (key === 'suggested_motion') {
      children.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: `Councilor moves: "${car.suggested_motion || ''}"`, font: 'Calibri' })] }))
      children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'Mayor calls for a second, discussion, and vote.', font: 'Calibri' })] }))
    } else {
      children.push(body(car[key]))
    }
  }

  children.push(heading('Requires a Resolution:'))
  children.push(body(car.requires_resolution ? 'Yes' : 'No'))
  children.push(heading('Requires a Public Hearing:'))
  children.push(body(car.requires_public_hearing ? 'Yes' : 'No'))

  const doc = new Document({
    sections: [{
      properties: { page: { size: { width: PAGE_WIDTH_DXA, height: PAGE_HEIGHT_DXA }, margin: { top: MARGIN_DXA, bottom: MARGIN_DXA, left: MARGIN_DXA, right: MARGIN_DXA } } },
      children,
    }],
  })

  return await Packer.toBlob(doc)
}

export async function downloadCarDocx(car, meetingDate) {
  const blob = await generateCarDocx(car, meetingDate)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${car.submission_number}.docx`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
