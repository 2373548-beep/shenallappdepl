import type { AccessCode, Contact, QuizQuestion, TrafficSign } from "./types";
import { parsedQuestions } from "./parsed-questions";
import { generatedCodes } from "./parsed-codes";
import { parsedSigns } from "./parsed-signs";

const now = () => new Date().toISOString();

export function createSeedData() {
  const accessCodes: AccessCode[] = generatedCodes;

  const quizQuestions: QuizQuestion[] = parsedQuestions;

  const trafficSigns: TrafficSign[] = parsedSigns;

  const contacts: Contact[] = [
    {
      id: 1,
      role: "خاوەن",
      name: "حسن حمد عمر",
      phone: "٠٧٧٠١٥٣٣٨٥٩",
      image_url: "https://i.postimg.cc/YCGF7Qy1/07701533859.jpg",
      display_order: 1,
    },
    {
      id: 2,
      role: "بەڕێوەبەر",
      name: "کارزان محمود بایز",
      phone: "٠٧٥٠٧٨١٨١١٥",
      image_url: "https://i.postimg.cc/XYG5W9D5/07507818115.jpg",
      display_order: 2,
    },
    {
      id: 3,
      role: "ڕاهێنەر",
      name: "حسین حمە ابراهیم",
      phone: "٠٧٥٠١٣٣٤٤٥٠",
      image_url: "https://i.postimg.cc/52YzJ8kj/07501334450.jpg",
      display_order: 3,
    },
    {
      id: 4,
      role: "مامۆستا و ڕاهێنەر",
      name: "سکاڵا محمد رسول",
      phone: "٠٧٥٠١٨٤٢٨٤٣",
      image_url: "https://i.postimg.cc/P5pDH1Fv/07501842843.jpg",
      display_order: 4,
    },
    {
      id: 5,
      role: "مامۆستا و ڕاهێنەر",
      name: "سازگار حمە رسول",
      phone: "٠٧٥٠١٩٦٦٤١٩",
      image_url: "https://i.postimg.cc/RZ6tmwb1/07501966419.jpg",
      display_order: 5,
    },
    {
      id: 6,
      role: "ڕاهێنەر",
      name: "احمد حمد عبدالله",
      phone: "٠٧٧٠١٥٦٠٧٧٠",
      image_url: "https://i.postimg.cc/pLhjvK1Y/07701560770.jpg",
      display_order: 6,
    },
  ];

  return { accessCodes, quizQuestions, trafficSigns, contacts };
}
