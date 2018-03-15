<?php

	$url = "https://lb-sinnix.mybluemix.net";
	$tweets_url = $url . "/twitter";
	$twitter_res = json_decode(file_get_contents($tweets_url));
	$hashtag = "#IBM";
	
	$tweets_HTML = "";
	$cont = 0;
	$c_sentiment_positive = 0;
	$c_sentiment_neutral = 0;
	$c_sentiment_negative = 0;
	foreach($twitter_res->{'tweets'} as $x => $value)
	{
		$cont++;
		$text = $value->{'text'};
		$sentiment = $value->{'sentiment'};
		$tweets_HTML .= "<div class='tweet_$sentiment'><b>$sentiment</b>" . " | " . str_replace("#SellForward90","", $text) . "</div><br>";
		switch ($sentiment)
		{
			case "POSITIVO":$c_sentiment_positive++;break;
			case "NEGATIVO": $c_sentiment_negative++;break;
			case "NEUTRAL": $c_sentiment_neutral++;break;
		}

		if($cont == 20)
			break;
	}

	$tweets_entities_url = $url . "/twitter-analysis";
	$twitter_entities_res = json_decode(file_get_contents($tweets_entities_url));
	$tweets_entities_HTML = '[';
	$cont = 0;
	foreach($twitter_entities_res->{'data'} as $x => $value)
	{
		$cont++;
		$rnd = rand(1,10);
		$tweets_entities_HTML .= '{\"text\":\"' . $value . '\", \"weight\":' . $rnd . '}';
		if($cont < sizeof($twitter_entities_res->{'data'}))
			$tweets_entities_HTML .= ",";
	}
	$tweets_entities_HTML .= ']';
?>

<html>
	<head>
        <meta http-equiv="refresh" content="300" >
		<head>
			<meta http-equiv="Content-type" content="text/html; charset=utf-8" />
			<link rel="stylesheet" href="styles/jqcloud.min.css">
			<title>Bluemix SellForward</title>
		</head>
		<style>
			
			body
			{
				font-size:15px;
			}
			
			.tweet_POSITIVO
			{
				background-color: rgba(146, 208, 80,0.5);
				padding:10px;
			}
			.tweet_NEGATIVO
			{
				background-color: rgba(255, 99, 132,0.7);
				padding:10px;
			}
			.tweet_NEUTRAL
			{
				background-color: rgba(255, 216, 91,0.7);
				padding:10px;
			}
			#bluemix
			{
				float:right;
				z-index:999;
				height:150px
			}
		</style>
    </head>
	<body onload="load()">
		
		<img id="bluemix" src="images/ibm-cloud.png">
		<table width="100%">
			<tr>
				<td style="width:40%;border-right: solid 10px rgb(191,26,144);vertical-align:top;text-align:center;padding-left:50px ">
					<div style="width:300px; height:300px">
						<span style="font-size:15px;font-weight:bold">Sentimiento:</span><br>
						<canvas id="sentimentChart" width="300" height="300"></canvas>
					</div><br><br><br><br>

					<div style="width:300; height:300px">
						<span style="font-size:15px;font-weight:bold">Tópicos:</span><br>
						<div id="wordscloud" name="wordscloud" width="500" height="200"></div>
					</div>
					
				</td>
				<td style="width:60%;vertical-align:top; padding-left:40px">
					<img src="images/twitter.png" width="80px" style="vertical-align:middle"><span style="font-weight:bold;font-size:20px"> <?php echo $hashtag; ?></span>
					<?php echo $tweets_HTML; ?>
				</td>
			</tr>
		</table>


		<script>
			function load()
			{
				loadwords();
				loadchart();
			}

			function loadwords()
            {
                var words = JSON.parse(<?php echo '"' . $tweets_entities_HTML . '"'; ?>);

                $('#wordscloud').jQCloud(words,{
					width: 300,
					height: 300,
					steps:10
                });
            }

            function loadchart()
            {
                var sentimentObj = document.getElementById("sentimentChart").getContext('2d');
                
				var dataSentiment = {
                    labels: ["Positivo", "Negativo", "Neutral"],
                    datasets: [{
                        label: 'Sentimiento',
                        data: [
								<?php echo $c_sentiment_positive; ?>, 
								<?php echo $c_sentiment_negative; ?>,
								<?php echo $c_sentiment_neutral; ?>],
                        backgroundColor: [
                            'rgba(146, 208, 80, 0.2)',
							'rgba(255, 99, 132, 0.2)',
							'rgba(255, 216, 91,0.2)'
                        ],
                        borderColor: [
							'rgba(146, 208, 80, 1)',
							'rgba(255,99,132,1)',
                            'rgba(255, 216, 91,1)'
                        ],
                        borderWidth: 1
                    }]
                };

                
				var chartSentiment = new Chart(sentimentObj, {
                    type: 'doughnut',
                    data: dataSentiment
                });

            }
        </script>

        <script src="scripts/Chart.bundle.min.js"></script>
        <script src="scripts/Chart.min.js"></script>
		<script src="scripts/jquery-3.2.1.min.js"></script>
        <script src="scripts/jqcloud.min.js"></script>

	</body>
</html>