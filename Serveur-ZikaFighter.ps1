param([int]$Port = 8765)
# Emergency Windows local server for Zika Fighter. Requires no installed software.
$ErrorActionPreference='Stop'
$root=[System.IO.Path]::GetFullPath($PSScriptRoot)
$listener=[System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback,$Port)
try{
 $listener.Start()
 Write-Host 'ZIKA FIGHTER v86 - Serveur local' -ForegroundColor Green
 Write-Host "Le jeu est accessible a http://127.0.0.1:$Port/"
 Write-Host 'Conservez cette fenetre ouverte pendant la partie. Fermez-la pour arreter.'
 while($true){
  $client=$listener.AcceptTcpClient()
  try{
   $client.ReceiveTimeout=15000
   $client.SendTimeout=15000
   $stream=$client.GetStream()
   $reader=[System.IO.StreamReader]::new($stream,[Text.Encoding]::ASCII,$false,4096,$true)
   $first=$reader.ReadLine()
   if([string]::IsNullOrEmpty($first)){continue}
   $parts=$first.Split(' ')
   if($parts.Length -lt 2){continue}
   $verb=$parts[0]
   $range=''
   while($true){
    $line=$reader.ReadLine()
    if([string]::IsNullOrEmpty($line)){break}
    if($line.StartsWith('Range:',[StringComparison]::OrdinalIgnoreCase)){$range=$line.Substring(6).Trim()}
   }
   $path=[Uri]::UnescapeDataString($parts[1].Split('?')[0]).TrimStart('/')
   if($path -eq ''){$path='index.html'}
   $local=$path.Replace('/',[IO.Path]::DirectorySeparatorChar)
   $file=[IO.Path]::GetFullPath([IO.Path]::Combine($root,$local))
   $inside=$file.StartsWith(($root.TrimEnd([IO.Path]::DirectorySeparatorChar)+[IO.Path]::DirectorySeparatorChar),[StringComparison]::OrdinalIgnoreCase)
   if(-not $inside -or -not [IO.File]::Exists($file)){
    $text=[Text.Encoding]::UTF8.GetBytes('404 Not Found')
    $header="HTTP/1.1 404 Not Found`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($text.Length)`r`nConnection: close`r`n`r`n"
    $h=[Text.Encoding]::ASCII.GetBytes($header)
    $stream.Write($h,0,$h.Length)
    $stream.Write($text,0,$text.Length)
    continue
   }
   $type=switch([IO.Path]::GetExtension($file).ToLowerInvariant()){
    '.html' {'text/html; charset=utf-8'}
    '.js' {'text/javascript; charset=utf-8'}
    '.css' {'text/css; charset=utf-8'}
    '.json' {'application/json'}
    '.png' {'image/png'}
    '.jpg' {'image/jpeg'}
    '.jpeg' {'image/jpeg'}
    '.webp' {'image/webp'}
    '.svg' {'image/svg+xml'}
    '.mp3' {'audio/mpeg'}
    '.ogg' {'audio/ogg'}
    '.wav' {'audio/wav'}
    '.woff2' {'font/woff2'}
    '.woff' {'font/woff'}
    '.ico' {'image/x-icon'}
    default {'application/octet-stream'}
   }
   $fs=[IO.File]::OpenRead($file)
   try{
    $total=$fs.Length;$from=[long]0;$to=$total-1;$partial=$false
    if($range -match '^bytes=(\d+)-(\d*)$'){
     $from=[long]::Parse($Matches[1])
     if($Matches[2] -ne ''){$to=[Math]::Min($to,[long]::Parse($Matches[2]))}
     if($from -lt $total -and $to -ge $from){$partial=$true}
     else{$from=0;$to=$total-1}
    }
    $length=$to-$from+1
    $status=if($partial){'206 Partial Content'}else{'200 OK'}
    $extra=if($partial){"Content-Range: bytes $from-$to/$total`r`n"}else{''}
    $header="HTTP/1.1 $status`r`nContent-Type: $type`r`nContent-Length: $length`r`nAccept-Ranges: bytes`r`n$extra"+"Cache-Control: no-store`r`nConnection: close`r`n`r`n"
    $h=[Text.Encoding]::ASCII.GetBytes($header)
    $stream.Write($h,0,$h.Length)
    if($verb -ne 'HEAD'){
     $fs.Seek($from,[IO.SeekOrigin]::Begin)|Out-Null
     $buffer=New-Object byte[] 65536
     $remaining=$length
     while($remaining -gt 0){
      $n=$fs.Read($buffer,0,[int][Math]::Min($buffer.Length,$remaining))
      if($n -le 0){break}
      $stream.Write($buffer,0,$n)
      $remaining-=$n
     }
    }
   }finally{$fs.Dispose()}
  }catch{
   Write-Host "Requete interrompue: $($_.Exception.Message)" -ForegroundColor DarkYellow
  }finally{$client.Close()}
 }
}finally{$listener.Stop()}
