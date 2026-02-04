/* =========================================================
   GOOGLE APPS SCRIPT - Future Grammar Mastery
   =========================================================
   
   SETUP INSTRUCTIONS:
   
   1. Open Google Sheets and create a new spreadsheet
   2. Name it "Grammar Game Data" (or anything you like)
   3. Create these columns in Row 1:
      A: Timestamp
      B: Type
      C: Student
      D: TimeSeconds
      E: Correct
      F: Streak
      G: QuestionType
      H: Sentence
      I: Tense
      J: PickedAnswer
      K: CorrectAnswer
      L: TotalMistakes
      M: OrderMistakes
      N: TenseMistakes
      O: MeaningMistakes
      P: Level
      Q: Detail
   
   4. Go to Extensions > Apps Script
   5. Delete any code there and paste this entire script
   6. Click Save (Ctrl+S)
   7. Click Deploy > New deployment
   8. Choose "Web app"
   9. Set "Execute as" to "Me"
   10. Set "Who has access" to "Anyone"
   11. Click Deploy
   12. Copy the URL and paste it in your game code (SHEET_ENDPOINT)
   
========================================================= */

const SECRET_KEY = "GRAMMAR_GAME_2024";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Security check
    if (data.secret !== SECRET_KEY) {
      return ContentService.createTextOutput(JSON.stringify({ 
        error: "Invalid secret" 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    if (data.type === "SESSION_COMPLETE") {
      // Log completed session summary
      sheet.appendRow([
        data.timestamp || new Date().toISOString(),
        "SESSION_COMPLETE",
        data.student || "",
        data.time_seconds || 0,
        "YES", // completed
        25, // final streak
        "", // question type
        "", // sentence
        "", // tense
        "", // picked
        "", // correct
        data.total_mistakes || 0,
        data.order_mistakes || 0,
        data.tense_mistakes || 0,
        data.meaning_mistakes || 0,
        data.level || "",
        JSON.stringify({
          session_start: data.session_start,
          completed: true
        })
      ]);
    } else if (data.type === "ATTEMPT") {
      // Log each attempt
      sheet.appendRow([
        data.timestamp || new Date().toISOString(),
        "ATTEMPT",
        data.student || "",
        data.time_seconds || 0,
        data.correct ? "YES" : "NO",
        data.streak || 0,
        data.question_type || "",
        data.sentence || "",
        data.tense || "",
        data.picked_answer || "",
        data.correct_answer || "",
        "", // total mistakes (only in summary)
        "", // order mistakes
        "", // tense mistakes
        "", // meaning mistakes
        "", // level
        data.detail || ""
      ]);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ 
      success: true 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      error: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "Grammar Game API is running",
    message: "Use POST to send data"
  })).setMimeType(ContentService.MimeType.JSON);
}

/* =========================================================
   HELPER FUNCTIONS FOR TEACHERS
========================================================= */

// Get summary of all students
function getStudentSummary() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  const students = {};
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const student = row[2]; // Column C
    const type = row[1]; // Column B
    
    if (!student) continue;
    
    if (!students[student]) {
      students[student] = {
        sessions: 0,
        totalMistakes: 0,
        orderMistakes: 0,
        tenseMistakes: 0,
        meaningMistakes: 0,
        totalTime: 0
      };
    }
    
    if (type === "SESSION_COMPLETE") {
      students[student].sessions++;
      students[student].totalMistakes += row[11] || 0;
      students[student].orderMistakes += row[12] || 0;
      students[student].tenseMistakes += row[13] || 0;
      students[student].meaningMistakes += row[14] || 0;
      students[student].totalTime += row[3] || 0;
    }
  }
  
  return students;
}

// Create a summary sheet
function createSummarySheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let summarySheet = ss.getSheetByName("Summary");
  
  if (!summarySheet) {
    summarySheet = ss.insertSheet("Summary");
  } else {
    summarySheet.clear();
  }
  
  // Headers
  summarySheet.appendRow([
    "Student",
    "Sessions Completed",
    "Total Mistakes",
    "ORDER Mistakes",
    "TENSE Mistakes", 
    "MEANING Mistakes",
    "Total Practice Time (min)",
    "Avg Mistakes per Session"
  ]);
  
  const students = getStudentSummary();
  
  for (const [name, data] of Object.entries(students)) {
    summarySheet.appendRow([
      name,
      data.sessions,
      data.totalMistakes,
      data.orderMistakes,
      data.tenseMistakes,
      data.meaningMistakes,
      Math.round(data.totalTime / 60),
      data.sessions > 0 ? Math.round(data.totalMistakes / data.sessions * 10) / 10 : 0
    ]);
  }
  
  // Format header
  summarySheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#4285f4").setFontColor("white");
  summarySheet.autoResizeColumns(1, 8);
}
