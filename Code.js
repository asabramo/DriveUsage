var FILENAME = 'Drive space summary';
var MAX_FILES = 10000;

function convertToMB(bytes) {
  return (bytes / 1024 / 1024).toFixed(2);
}  

function createSummaryFile() {
  var file = DriveApp.getFilesByName(FILENAME);
  if (file && file.hasNext()) {
    file = file.next();
  }
  else {
    file = DriveApp.createFile(FILENAME, "EMPTY");
  }
  return file;
}

function creatSummarySpreadsheet(foldersArray) {
  var file = DriveApp.getFilesByName(FILENAME);
  if (file && file.hasNext()) {
    file.next().setTrashed(true);
  }
  var spreadSheet = SpreadsheetApp.create(FILENAME);
  var sheet = spreadSheet.getSheets()[0];
  sheet.appendRow(['','', "This is the summary of your Drive storage usage as of " + Date()]);
  var used = DriveApp.getStorageUsed();
  var limit = DriveApp.getStorageLimit();
  sheet.appendRow(['','',"Used: " + convertToMB(used)  + "MB out of " + convertToMB(limit) + "MB (" + (used*100/limit).toFixed(2) + "%)"]);  
  sheet.appendRow(["Folder", "Size (MB)"]);
  sheet.getRange(1,1,3,3).setFontWeight("bold");
  foldersArray.forEach(function (folderStruct){
    sheet.appendRow(['=hyperlink("' + folderStruct.folder.getUrl() + '", "' + folderStruct.folder.getName() + '")',
                     convertToMB(folderStruct.size)]);
  });
  sheet.autoResizeColumn(1);
  sheet.autoResizeColumn(2);
  var chart = sheet.newChart()
     .setChartType(Charts.ChartType.PIE)
     .addRange(sheet.getRange("A1:B"+foldersArray.length))
     .setPosition(4, 4, 0, 0)
     .build();

  sheet.insertChart(chart);
  return spreadSheet.getUrl();
}

function calcFolderSize(folder) {
  var files = folder.getFiles();
  var size = 0;
  while (files.hasNext()) {
    var file = files.next();
    var owner = file.getOwner();
    if (Session.getActiveUser().getEmail() !== owner.getEmail()) {
      //Filter files that are shared with you but owned by others
      return 0;
    }
    size += file.getSize();
  }  
  return size;
}

function driveUsageByFolder() {
  Logger.log("driveUsageByFolder started");
  var foldersArray = [];
  var folders = DriveApp.getFolders();
  var i = 0;
  while (folders.hasNext() && i < MAX_FILES) {
    var folder = folders.next();    
    var size = calcFolderSize(folder);
    foldersArray.push({folder: folder, size: size});
    i++;
  }
  foldersArray.sort(function (folder1, folder2) {
    return folder2.size - folder1.size;
  });

  return creatSummarySpreadsheet(foldersArray);
}

function getUserDetails() {
  Logger.log("getUserDetails started");
  var ret = {
    username: Session.getActiveUser().getEmail(),
    usage: getUsage()
  }
  return ret;
}

function getUsage() {
  var used = DriveApp.getStorageUsed();
  var limit = DriveApp.getStorageLimit();
  return "\nUsed Drive Space: " + convertToMB(used)  + "MB out of " + convertToMB(limit) + "MB (" + (used*100/limit).toFixed(2) + "%)";
}

function doGet(e) {  
  
  //return HtmlService.createHtmlOutput(msg);
  return HtmlService.createTemplateFromFile('ui').evaluate();
}


// Helper function that puts external JS / CSS into the HTML file.
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}