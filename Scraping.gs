function scrapingTrigger() {
  // -----Spreadsheet meta-----
  var sheet = SpreadsheetApp.getActiveSheet();
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();

  // -----Get Spreadsheet Data-----
  var sheet_data = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();

  // -----Scraping-----
  try {
    var url = 'https://tiketore.com/tickets/search?perform_id=85895&ticket_count=1'
    var html = UrlFetchApp.fetch(url).getContentText();

    // Parser: from().to()はfromとtoに挟まれた部分を抜き出します。build()で文字列、iterate()で文字列の配列が得られます。
    var links = Parser.data(html)
      .from('<h2 class="h4">')
      .to('</h2>')
      .iterate();

    for (var i_links = 0; i_links < links.length; i_links++) {
      // サマソニチケット判別
      if (links[i_links].indexOf('ＳＵＭＭＥＲ　ＳＯＮＩＣ　２０１９　ＴＯＫＹＯ') !== -1) {
        // チケットリンク取得
        var ticket_link = 'https://tiketore.com';
        ticket_link += Parser.data(links[i_links])
          .from('<a href="')
          .to('">')
          .build();
        Logger.log('ticket_link: ' + ticket_link);

        // チケットリンクが過去の記録と一致するかチェック
        var is_ticket_link_new = true;
        for (var i_sheet = 0; i_sheet < sheet_data.length; i_sheet++) {
          var tiket_link_onSheet = sheet_data[i_sheet][1];
          Logger.log('tiket_link_onSheet: ' + tiket_link_onSheet);
          if (ticket_link === tiket_link_onSheet) {
            is_ticket_link_new = false;
          }
        }

        // 新規の場合シートに書き込み&Tweet
        if (is_ticket_link_new) {
          sheet.getRange(lastRow + 1, 1).setValue(new Date());
          sheet.getRange(lastRow + 1, 2).setValue(ticket_link);
          Twitter.tweet('【サマソニ2019東京 チケット公式リセール新着情報】\n' + createBitlyUrl(ticket_link) + '\n#サマソニ #summersonic #チケット');
        }
      }
    }
  } catch (e) {
    Logger.log('[Error] ' + e);
  }
}
