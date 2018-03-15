<?php

$results = array();
$img_obj = 
				'{"url": "' . "url" . '", ' .  
				'"emotion": "' . "desconocido" . '", ' .
				'"score": "' . 0 . '"}';
array_push($results, $img_obj);
array_push($results, $img_obj);
array_push($results, $img_obj);

print_r(convert_array_to_Json($results));exit();


    function convert_array_to_Json($array)
        {
            $string = "";
            $cont = 0;
            foreach($array as $x=>$value)
            {
                $cont++;
                $string .= $value;
                if($cont<sizeof($array))
                {
                    $string .= ",";
                }
            }
            return $string;
        }
?>