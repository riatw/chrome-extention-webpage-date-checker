/* MEMO
	BackGround(Event) Page = 後ろで動いているページ（権限強い、DOMアクセス不可）
	ContentScripts = 指定したドメインで読み込まれる追加JS（権限弱い、DOMアクセス可）
	BrowserAction = タスクバーから実行されるポップアップ（権限普通、DOMアクセス不可）
	http://www.apps-gcp.com/calendar-extension/
*/

function clearBuff() {
	$target = $("#buff");

	$target.text("");
}

function writeToBuff(text) {
	$target = $("#buff");

	$target.text( $target.text() + text );
}

$(document).ready(function(){
	$("#defaultmonth").val( new Date().getMonth() + 1 );

	// チェック実行
	$("#docheck").click(function() {
		var ngchars = [
			/(\d+)月(\d+)日\((.+?)\)/,
			/([^月|0-9][0-9]{1,2})日\((.+?)\)/
		];
			// /[･|～|\/]([0-9]{1,2})日\((.+?)\)/
		var dates = [];

		//出力初期化
		clearBuff();

		//チェック実行
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, { method: "getHTML" }, function(response) {
				var html = response;
				html = html.replace(/<!--[\s\S]*?-->/gm,"");

				var w = ["日","月","火","水","木","金","土"];
				var currentYear;

				writeToBuff("[テスト] 日付の曜日があっているか確認します");

				//正規表現のパターンは複数ある
				//本文から抽出→バラす→配列に入れるまで
				//重複はできれば省きたい
				for ( var i = 0; i < ngchars.length; i++ ) {
					var c_regP = new RegExp(ngchars[i], "gm");
					var dateArr = html.match(c_regP);

					console.log(dateArr);

					if ( dateArr ) {
						for ( var j = 0; j < dateArr.length; j++ ) {
							var c_regP = new RegExp(ngchars[i], "");
							var currentDate = dateArr[j];

							currentDate = currentDate.match(c_regP).map(function(e){
								e = e.replace("･","").replace("祝","");

								if ( e !== "" || e != null ) {
									return e;
								}
							});

							currentYear = new Date().getFullYear();

							// 配列の冒頭はゴミデータのため削除
							currentDate.shift();

							if ( currentDate.length == 2 ) {
								currentDate.unshift($("#defaultmonth").val());
							}

							if ( currentDate.length == 3 ) {
								if ( currentDate[0] <= parseInt($("#sepmonth").val()) ) {
									currentYear++;
								}

								currentDate.unshift(currentYear);
							}

							dateArr[j] = currentDate;
						}

						dates = dates.concat(dateArr);
					}
				}

				writeToBuff( "以下の日にちが含まれています:" + "\n\n" );

				for ( var i = 0; i < dates.length; i++ ) {
					currentDate = dates[i];

					var d = new Date( currentDate[0] + "/" + currentDate[1] + "/" + currentDate[2] );

					writeToBuff( currentDate.join("/") );

					if ( currentDate[3] == w[d.getDay()] ) {
						writeToBuff( " [OK]" + "\n" );
					}
					else {
						writeToBuff( " [NG]" + "\n" );
					}
				}

				chrome.tabs.sendMessage(tabs[0].id, { method: "highlight" }, function(response) {});
			});
		});
	});
});
