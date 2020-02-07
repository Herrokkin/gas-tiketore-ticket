function scrapingTrigger() {
  var debug_mode = false; // true => Run scraping but not post to Twitter

  // -----Spreadsheet meta-----
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();

  // -----Get Spreadsheet Data-----
  var sheet_data = sheet.getRange(3, 1, lastRow, lastColumn).getValues();

  var event_name_tiketore = sheet.getRange(1, 1).getValue();
  var event_name_tweet = sheet.getRange(1, 2).getValue();
  var hash_tags = sheet.getRange(1, 3).getValue();
  var event_url = sheet.getRange(1, 4).getValue();

  // -----Scraping-----
  try {
    var html = UrlFetchApp.fetch(event_url).getContentText();

    // Parser: from().to()はfromとtoに挟まれた部分を抜き出します。build()で文字列、iterate()で文字列の配列が得られます。
    var links = Parser.data(html)
      .from('<h2 class="h4">')
      .to('</h2>')
      .iterate();

    for (var i_links = 0; i_links < links.length; i_links++) {
      // イベント名からチケット判別
      if (links[i_links].indexOf(event_name_tiketore) !== -1) {
        // チケットリンク取得
        var ticket_link = 'https://tiketore.com';
        ticket_link += Parser.data(links[i_links])
          .from('<a href="')
          .to('">')
          .build();
        Logger.log('tiketore_link: ' + ticket_link);

        // チケットリンクが過去の記録と一致するかチェック
        lastRow = sheet.getLastRow();
        sheet_data = sheet.getRange(3, 1, lastRow - 2, lastColumn).getValues();
        var is_ticket_link_new = true;
        for (var i_sheet = 0; i_sheet < sheet_data.length; i_sheet++) {
          var tiket_link_onSheet = sheet_data[i_sheet][1];
          // Logger.log('link_onSheet: ' + tiket_link_onSheet);
          if (ticket_link === tiket_link_onSheet) {
            is_ticket_link_new = false;
            break;
          }
        }
        Logger.log('is_ticket_link_new: ' + is_ticket_link_new);

        // 新規の場合シートに書き込み&Tweet
        if (is_ticket_link_new) {
          // シート書き込み
          sheet.getRange(lastRow + 1, 1).setValue(new Date());
          sheet.getRange(lastRow + 1, 2).setValue(ticket_link);

          // Tweet
          var status_txt = '🎫リセールチケット新着情報\n' + event_name_tweet + '\n' + createBitlyUrl(ticket_link) + '\n' + hash_tags;
          
          debug_mode ? Logger.log('[DEBUG] Tweet Done:\n' + status_txt) : Twitter.tweet(status_txt);
        }
      }
    }
  } catch (e) {
    Logger.log('[Error] ' + e);
  }
}
