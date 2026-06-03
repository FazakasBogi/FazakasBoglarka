$ErrorActionPreference = "Stop"

$romaniaFajl = "Románia.csv"
$hollandiaFajl = "Hollandia.csv"

$vasarlasiCsv = "vasarlasi_szokasok_osszefoglalo.csv"
$javitasiCsv = "hasznalati_javitasi_szokasok_osszefoglalo.csv"
$hasznalatUtaniCsv = "hasznalat_utani_szokasok_osszefoglalo.csv"
$hasznalatUtaniDontesekCsv = "hasznalat_utani_dontesek_osszefoglalo.csv"
$hasznalatUtaniDontesekMatrixCsv = "hasznalat_utani_dontesek_matrix.csv"

$eszkozok = @("Kis eszközök", "Személyes IT eszközök", "Nagy háztartási gépek")

function Tisztit-Szoveg {
    param([string]$Ertek)
    if ([string]::IsNullOrWhiteSpace($Ertek)) { return "" }
    return (($Ertek.Trim() -replace [string][char]0xFEFF, "") -replace "\s+", " ").Trim()
}

function Test-UresSor {
    param($Sor)
    $kitoltott = $Sor.PSObject.Properties.Value | Where-Object {
        -not [string]::IsNullOrWhiteSpace([string]$_)
    }
    return (($kitoltott | Measure-Object).Count -eq 0)
}

function Get-SkalaErtek {
    param([string]$Ertek)
    $x = Tisztit-Szoveg $Ertek
    if ($x -match "^[1-6]") { return [int]$matches[0] }
    return $null
}

function Get-Median {
    param([int[]]$Ertekek)
    if ($Ertekek.Count -eq 0) { return "" }
    $rendezett = $Ertekek | Sort-Object
    $kozep = [int][Math]::Floor($rendezett.Count / 2)
    if ($rendezett.Count % 2 -eq 1) { return [double]$rendezett[$kozep] }
    return [Math]::Round((($rendezett[$kozep - 1] + $rendezett[$kozep]) / 2), 2)
}

function Normalizal-IgenNem {
    param([string]$Ertek)
    $x = Tisztit-Szoveg $Ertek
    switch -Wildcard ($x) {
        "Yes" { return "Igen" }
        "No" { return "Nem" }
        "Da" { return "Igen" }
        "Nu" { return "Nem" }
        "igen" { return "Igen" }
        "nem" { return "Nem" }
        default {
            if ([string]::IsNullOrWhiteSpace($x)) { return "" }
            return $x
        }
    }
}

function Add-Sor {
    param(
        [System.Collections.Generic.List[object]]$Lista,
        [string]$Orszag,
        [string]$KerdesKod,
        [string]$Kerdes,
        [string]$Eszkoztipus,
        [string]$SorTipus,
        [string]$Valasz,
        $Darab,
        [int]$BaseN,
        [string]$Ertek = ""
    )

    $Lista.Add([pscustomobject]@{
        Orszag = $Orszag
        KerdesKod = $KerdesKod
        Kerdes = $Kerdes
        Eszkoztipus = $Eszkoztipus
        SorTipus = $SorTipus
        Valasz = $Valasz
        Darab = $Darab
        BaseN = $BaseN
        Szazalek = if ($BaseN -gt 0 -and $Darab -is [int] -and $Darab -ge 0) { [Math]::Round(($Darab / $BaseN) * 100, 1) } else { "" }
        Ertek = $Ertek
    })
}

function Add-SkalaOsszesites {
    param(
        [System.Collections.Generic.List[object]]$Lista,
        [string]$Orszag,
        [object[]]$Sorok,
        [string]$Oszlop,
        [string]$KerdesKod,
        [string]$Kerdes,
        [string]$Eszkoztipus
    )

    $ertekek = @($Sorok | ForEach-Object { Get-SkalaErtek $_.$Oszlop } | Where-Object { $_ -ne $null })
    $n = $ertekek.Count
    if ($n -eq 0) { return }

    $atlag = [Math]::Round(($ertekek | Measure-Object -Average).Average, 2)
    $median = Get-Median $ertekek
    Add-Sor $Lista $Orszag $KerdesKod $Kerdes $Eszkoztipus "Mutató" "Átlag" "" $n $atlag
    Add-Sor $Lista $Orszag $KerdesKod $Kerdes $Eszkoztipus "Mutató" "Medián" "" $n $median

    for ($i = 1; $i -le 6; $i++) {
        $darab = ($ertekek | Where-Object { $_ -eq $i } | Measure-Object).Count
        Add-Sor $Lista $Orszag $KerdesKod $Kerdes $Eszkoztipus "Eloszlás" "$i" $darab $n
    }

    $magas = ($ertekek | Where-Object { $_ -ge 5 } | Measure-Object).Count
    Add-Sor $Lista $Orszag $KerdesKod $Kerdes $Eszkoztipus "Mutató" "5-6 válasz együtt" $magas $n
}

function Add-EgyvalaszosOsszesites {
    param(
        [System.Collections.Generic.List[object]]$Lista,
        [string]$Orszag,
        [object[]]$Sorok,
        [string]$Oszlop,
        [string]$KerdesKod,
        [string]$Kerdes,
        [string]$Eszkoztipus,
        [scriptblock]$Normalizalo
    )

    $valaszok = @($Sorok | ForEach-Object { & $Normalizalo $_.$Oszlop } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    $n = $valaszok.Count
    foreach ($csoport in ($valaszok | Group-Object | Sort-Object -Property @{Expression = "Count"; Descending = $true}, Name)) {
        Add-Sor $Lista $Orszag $KerdesKod $Kerdes $Eszkoztipus "Válasz" $csoport.Name $csoport.Count $n
    }
}

function Add-TobbvalaszosOsszesites {
    param(
        [System.Collections.Generic.List[object]]$Lista,
        [string]$Orszag,
        [object[]]$Sorok,
        [string]$Oszlop,
        [string]$KerdesKod,
        [string]$Kerdes,
        [string]$Eszkoztipus,
        [object[]]$OpcioMintak
    )

    $n = ($Sorok | Where-Object { -not [string]::IsNullOrWhiteSpace((Tisztit-Szoveg $_.$Oszlop)) } | Measure-Object).Count
    foreach ($opcio in $OpcioMintak) {
        $darab = ($Sorok | Where-Object {
            $valasz = Tisztit-Szoveg $_.$Oszlop
            $talalat = $false
            foreach ($minta in $opcio.Mintak) {
                if ($valasz -like "*$minta*") { $talalat = $true; break }
            }
            $talalat
        } | Measure-Object).Count
        Add-Sor $Lista $Orszag $KerdesKod $Kerdes $Eszkoztipus "Többválaszos opció" $opcio.Valasz $darab $n
    }
}

function New-Opcio {
    param([string]$Valasz, [string[]]$Mintak)
    return [pscustomobject]@{ Valasz = $Valasz; Mintak = $Mintak }
}

$hasznaltVasarlasOkok = @(
    New-Opcio "Kedvezőbb ár" @("Kedvezőbb ár", "Better price", "Preț mai avantajos")
    New-Opcio "Környezeti okok" @("Környezeti ok", "Sustainability", "motive de mediu")
    New-Opcio "Nem volt fontos, hogy új legyen" @("Nem az volt a lényeg", "Nem új volt", "It didn't have to be new", "Nu a fost important")
)

$hasznaltVisszatartoOkok = @(
    New-Opcio "Minőségi aggályok" @("Minőségi", "Quality", "calitate")
    New-Opcio "Higiéniai aggályok" @("Higéniai", "Hygiene", "igien")
    New-Opcio "Nem érte meg az ár" @("Nem érte meg", "price wasn't worth", "Nu merita")
    New-Opcio "Nem tudtam, hol lehet venni" @("Nem tudtam hol", "didn't know where")
)

$javitasiAkadalyok = @(
    New-Opcio "A javítás ára közel van az új termék árához" @("javítás ára", "cost of the repair", "Costul repara")
    New-Opcio "Nem talál megbízható szervizt" @("megbízható szerviz", "reliable repair shop")
    New-Opcio "Túl sok időt vesz igénybe" @("Túl sok idő", "too much time")
    New-Opcio "Az alkatrészek nem beszerezhetők" @("alkatrész", "parts are not available")
    New-Opcio "Adatbiztonsági aggályok" @("Adatbiztonság", "Data security")
)

$javitasiOsztonzok = @(
    New-Opcio "Alacsonyabb javítási költség" @("Alacsonyabb javítási", "Lower repair costs", "Cost redus")
    New-Opcio "Megbízható szerviz könnyebb elérése" @("megbízható szerviz", "reliable service")
    New-Opcio "Pénzügyi ösztönző" @("Pénzügyi ösztönző", "Financial incentive")
    New-Opcio "Kényelmesebb folyamat" @("Kényelmesebb folyamat", "convenient process", "Proces mai convenabil")
    New-Opcio "Nagyobb környezeti tudatosság" @("környezeti tudatosság", "environmental awareness")
)

$hasznalatUtaniOpcio = @(
    New-Opcio "Otthon tárolja" @("Otthon tárolom", "keeping it at home")
    New-Opcio "Továbbadja ismerősnek" @("Továbbadom", "pass this on")
    New-Opcio "Eladja online / használt platformon" @("Eladom online", "sell on online", "vând")
    New-Opcio "Leadja e-hulladékgyűjtő ponton" @("e-hulladék gyűjtőpontra", "e-waste collection point", "punct de colectare")
    New-Opcio "Visszaviszi üzletbe vagy gyártóhoz" @("Visszaviszem", "return it to the store", "manufacturer")
    New-Opcio "Kidobja normál szemétbe" @("normál", "regular household trash")
)

$leadasOsztonzok = @(
    New-Opcio "Pénzügyi jutalom" @("Pénzügyi jutalom", "Financial incentive")
    New-Opcio "Közelebbi / kényelmesebb leadóhely" @("Közelebbi", "closer or more convenient", "mai apropiat")
    New-Opcio "Házhoz jövő szolgáltatás" @("Házhoz", "Home delivery", "ridicare")
    New-Opcio "Semmi" @("Nothing")
)

$leadasAkadalyok = @(
    New-Opcio "Nem tud közeli leadóhelyet" @("Nem tudok közeli", "don't know of a nearby", "Nu știu")
    New-Opcio "Túl messze van / nehezen megközelíthető" @("Túl messze", "too far", "departe")
    New-Opcio "Adatbiztonsági aggályok" @("Adatbiztonsági", "Data security", "securitatea datelor")
    New-Opcio "Nem tartja fontosnak" @("Nem tartom fontosnak", "don't think it's important", "Nu consider")
)

$adatok = @(
    [pscustomobject]@{ Orszag = "Románia"; Sorok = @(Import-Csv $romaniaFajl -Encoding UTF8 | Where-Object { -not (Test-UresSor $_) }); Offset = 0 },
    [pscustomobject]@{ Orszag = "Hollandia"; Sorok = @(Import-Csv $hollandiaFajl -Encoding UTF8 | Where-Object { -not (Test-UresSor $_) }); Offset = 1 }
)

$vasarlasi = [System.Collections.Generic.List[object]]::new()
$javitasi = [System.Collections.Generic.List[object]]::new()
$hasznalatUtani = [System.Collections.Generic.List[object]]::new()
$hasznalatUtaniDontesek = [System.Collections.Generic.List[object]]::new()

foreach ($adat in $adatok) {
    $cols = $adat.Sorok[0].PSObject.Properties.Name
    $o = $adat.Offset

    for ($d = 0; $d -lt 3; $d++) {
        Add-SkalaOsszesites $vasarlasi $adat.Orszag $adat.Sorok $cols[(9 + $o + $d)] "V1" "Eszközcsere teljes elhasználódás előtt" $eszkozok[$d]
        Add-EgyvalaszosOsszesites $vasarlasi $adat.Orszag $adat.Sorok $cols[(12 + $o + $d)] "V2" "Használt vagy felújított eszköz vásárlása" $eszkozok[$d] ${function:Normalizal-IgenNem}
        Add-TobbvalaszosOsszesites $vasarlasi $adat.Orszag $adat.Sorok $cols[(15 + $o + $d)] "V3" "Használt/felújított vásárlás indoka" $eszkozok[$d] $hasznaltVasarlasOkok
        Add-TobbvalaszosOsszesites $vasarlasi $adat.Orszag $adat.Sorok $cols[(18 + $o + $d)] "V4" "Használt/felújított vásárlástól visszatartó ok" $eszkozok[$d] $hasznaltVisszatartoOkok
        Add-SkalaOsszesites $vasarlasi $adat.Orszag $adat.Sorok $cols[(23 + $o + $d)] "V6" "Nyitottság bérlésre vagy megosztott használatra" $eszkozok[$d]
        Add-SkalaOsszesites $vasarlasi $adat.Orszag $adat.Sorok $cols[(26 + $o + $d)] "V7" "Tartósság és javíthatóság fontossága vásárláskor" $eszkozok[$d]

        Add-SkalaOsszesites $javitasi $adat.Orszag $adat.Sorok $cols[(29 + $o + $d)] "J1" "Meghibásodott eszköz javíttatása" $eszkozok[$d]
        Add-TobbvalaszosOsszesites $javitasi $adat.Orszag $adat.Sorok $cols[(32 + $o + $d)] "J2" "Javítás elmaradásának oka" $eszkozok[$d] $javitasiAkadalyok
        Add-SkalaOsszesites $javitasi $adat.Orszag $adat.Sorok $cols[(37 + $o + $d)] "J5" "Teljesen megjavított eszköz további használata" $eszkozok[$d]
        Add-SkalaOsszesites $javitasi $adat.Orszag $adat.Sorok $cols[(40 + $o + $d)] "J6" "Kisebb hibával megjavított eszköz további használata" $eszkozok[$d]

        Add-TobbvalaszosOsszesites $hasznalatUtani $adat.Orszag $adat.Sorok $cols[(43 + $o + $d)] "U1" "Mi történik a már nem használt eszközzel?" $eszkozok[$d] $hasznalatUtaniOpcio
        Add-TobbvalaszosOsszesites $hasznalatUtaniDontesek $adat.Orszag $adat.Sorok $cols[(43 + $o + $d)] "U1" "Mi történik a már nem használt eszközzel?" $eszkozok[$d] $hasznalatUtaniOpcio
    }

    Add-EgyvalaszosOsszesites $vasarlasi $adat.Orszag $adat.Sorok $cols[(21 + $o)] "V5a" "Elektronikai eszközbérlés igénybevétele" "Általános" ${function:Normalizal-IgenNem}
    Add-EgyvalaszosOsszesites $vasarlasi $adat.Orszag $adat.Sorok $cols[(22 + $o)] "V5b" "Megosztáson alapuló használat igénybevétele" "Általános" ${function:Normalizal-IgenNem}

    Add-TobbvalaszosOsszesites $javitasi $adat.Orszag $adat.Sorok $cols[(35 + $o)] "J3" "Mi ösztönözné a javíttatást csere helyett?" "Általános" $javitasiOsztonzok
    Add-EgyvalaszosOsszesites $javitasi $adat.Orszag $adat.Sorok $cols[(36 + $o)] "J4" "Kisebb hibák saját kezű javítása" "Általános" ${function:Normalizal-IgenNem}

    Add-EgyvalaszosOsszesites $hasznalatUtani $adat.Orszag $adat.Sorok $cols[(46 + $o)] "U2" "Tudja-e, hol van közeli e-hulladék leadóhely?" "Általános" ${function:Normalizal-IgenNem}
    Add-TobbvalaszosOsszesites $hasznalatUtani $adat.Orszag $adat.Sorok $cols[(47 + $o)] "U3" "Mi ösztönözné a megfelelő leadásra?" "Általános" $leadasOsztonzok
    Add-TobbvalaszosOsszesites $hasznalatUtani $adat.Orszag $adat.Sorok $cols[(48 + $o)] "U4" "Mi akadályozza a leadást?" "Általános" $leadasAkadalyok
    Add-SkalaOsszesites $hasznalatUtani $adat.Orszag $adat.Sorok $cols[(49 + $o)] "U5" "Jövőbeni hajlandóság a megfelelő leadásra" "Általános"
}

$vasarlasi | Export-Csv -Path $vasarlasiCsv -NoTypeInformation -Encoding UTF8
$javitasi | Export-Csv -Path $javitasiCsv -NoTypeInformation -Encoding UTF8
$hasznalatUtani | Export-Csv -Path $hasznalatUtaniCsv -NoTypeInformation -Encoding UTF8
$hasznalatUtaniDontesek | Export-Csv -Path $hasznalatUtaniDontesekCsv -NoTypeInformation -Encoding UTF8

$matrix = [System.Collections.Generic.List[object]]::new()
foreach ($csoport in ($hasznalatUtaniDontesek | Group-Object Orszag, Eszkoztipus)) {
    $elso = $csoport.Group[0]
    $sor = [ordered]@{
        Orszag = $elso.Orszag
        Eszkoztipus = $elso.Eszkoztipus
        BaseN = $elso.BaseN
    }

    foreach ($valasz in @(
        "Otthon tárolja",
        "Továbbadja ismerősnek",
        "Eladja online / használt platformon",
        "Leadja e-hulladékgyűjtő ponton",
        "Visszaviszi üzletbe vagy gyártóhoz",
        "Kidobja normál szemétbe"
    )) {
        $talalat = $csoport.Group | Where-Object { $_.Valasz -eq $valasz } | Select-Object -First 1
        $prefix = $valasz -replace " / ", "_" -replace " ", "_" -replace "á", "a" -replace "é", "e" -replace "í", "i" -replace "ó", "o" -replace "ö", "o" -replace "ő", "o" -replace "ú", "u" -replace "ü", "u" -replace "ű", "u"
        $sor["${prefix}_db"] = if ($talalat) { $talalat.Darab } else { 0 }
        $sor["${prefix}_szazalek"] = if ($talalat) { $talalat.Szazalek } else { 0 }
    }

    $matrix.Add([pscustomobject]$sor)
}

$matrix | Export-Csv -Path $hasznalatUtaniDontesekMatrixCsv -NoTypeInformation -Encoding UTF8

Write-Output "Vásárlási szokások tábla mentve: $vasarlasiCsv ($($vasarlasi.Count) sor)"
Write-Output "Használati/javítási szokások tábla mentve: $javitasiCsv ($($javitasi.Count) sor)"
Write-Output "Használat utáni szokások tábla mentve: $hasznalatUtaniCsv ($($hasznalatUtani.Count) sor)"
Write-Output "Használat utáni döntések tábla mentve: $hasznalatUtaniDontesekCsv ($($hasznalatUtaniDontesek.Count) sor)"
Write-Output "Használat utáni döntések mátrix mentve: $hasznalatUtaniDontesekMatrixCsv ($($matrix.Count) sor)"




