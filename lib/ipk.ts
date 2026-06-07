export const gradeMap: Record<string, number> = { A: 4, 'A-': 3.75, 'B+': 3.5, B: 3, 'B-': 2.75, 'C+': 2.5, C: 2, D: 1, E: 0 };
export type CourseGrade = { course_name: string; sks: number; grade_letter: string; grade_point?: number; semester: number };

export function calculateIps(courses: CourseGrade[]) {
  const totalSks = courses.reduce((a, c) => a + Number(c.sks || 0), 0);
  const totalPoints = courses.reduce((a, c) => a + Number(c.sks || 0) * (Number(c.grade_point) || gradeMap[c.grade_letter?.toUpperCase()] || 0), 0);
  return { totalSks, ips: totalSks ? Number((totalPoints / totalSks).toFixed(2)) : 0, totalPoints };
}

export function cumulativeStats(courses: CourseGrade[]) {
  const bySemester = new Map<number, CourseGrade[]>();
  courses.forEach(c => bySemester.set(c.semester, [...(bySemester.get(c.semester) || []), c]));
  let cumSks = 0, cumPoints = 0;
  return Array.from(bySemester.entries()).sort((a,b)=>a[0]-b[0]).map(([semester, list]) => {
    const s = calculateIps(list);
    cumSks += s.totalSks;
    cumPoints += s.totalPoints;
    return { semester, ips: s.ips, sks: s.totalSks, ipk: cumSks ? Number((cumPoints / cumSks).toFixed(2)) : 0 };
  });
}

export function neededAverage(currentCourses: CourseGrade[], targetIpk: number, nextSemesterSks: number) {
  const current = calculateIps(currentCourses);
  if (!nextSemesterSks) return 0;
  const needed = ((targetIpk * (current.totalSks + nextSemesterSks)) - current.totalPoints) / nextSemesterSks;
  return Number(Math.min(4, Math.max(0, needed)).toFixed(2));
}

export function parseKhsText(raw: string) {
  const lines = raw.split(/\n+/).map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const semester = Number((raw.match(/semester\s*[:\-]?\s*(\d+)/i) || [])[1] || 1);
  const courses: CourseGrade[] = [];
  for (const line of lines) {
    const match = line.match(/^(.+?)\s+(\d{1,2})\s+(A-|B\+|B-|C\+|[ABCDE])(?:\s+([0-4](?:\.\d+)?))?$/i);
    if (match) courses.push({ course_name: match[1].trim(), sks: Number(match[2]), grade_letter: match[3].toUpperCase(), grade_point: match[4] ? Number(match[4]) : gradeMap[match[3].toUpperCase()], semester });
  }
  return { semester, courses, confidenceNote: courses.length ? 'OCR berhasil diparse. Tetap koreksi sebelum simpan.' : 'OCR terbaca, tapi format KHS perlu dikoreksi manual.' };
}
