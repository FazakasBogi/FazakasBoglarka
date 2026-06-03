$ErrorActionPreference = "Stop"

$hollandiaFajl = "Hollandia.csv"
$romaniaFajl = "Románia.csv"
$reszletesCsv = "ertekek_statisztika_reszletes.csv"
$osszefoglaloCsv = "ertekek_osszefoglalo_tabla.csv"
$tudasCsv = "ertekek_tudas_osszefoglalo_tabla.csv"
$tudasReszletesCsv = "ertekek_tudas_reszletes.csv"
$szovegesTxt = "ertekek_osszefoglalo_tabla.txt"

$allitasok = @(
    [pscustomobject]@{
        Kod = "E1"
        Tema = "Univerzalizmus"
        RovidNev = "Környezeti aggodalom"
        RomaniaMinta = "1. Aggaszt"
        HollandiaMinta = "1. I am concerned"
    },
    [pscustomobject]@{
        Kod = "E2"
        Tema = "Jóindulat"
        RovidNev = "Mások és jövő generációk védelme"
        RomaniaMinta = "2. Fontosnak tartom, hogy a döntéseimmel"
        HollandiaMinta = "2. I believe it is important that my decisions"
    },
    [pscustomobject]@{
        Kod = "E3"
        Tema = "Konformitás"
        RovidNev = "Közösségi szabályok követése"
        RomaniaMinta = "3. Igyekszem olyan szabályokat"
        HollandiaMinta = "3. I strive to follow rules"
    },
    [pscustomobject]@{
        Kod = "E4"
        Tema = "Biztonság"
        RovidNev = "Fenntartható társadalmi működés"
        RomaniaMinta = "4. Fontosnak tartom, hogy a társadalom"
        HollandiaMinta = "4. I believe it is important for society"
    }
)

function Tisztit-Szoveg {
    param([string]$Ertek)

    if ([string]::IsNullOrWhiteSpace($Ertek)) {
        return ""
    }

    return (($Ertek.Trim() -replace [string][char]0xFEFF, "") -replace "\s+", " ").Trim()
}

function Test-UresSor {
    param($Sor)

    $kitoltottMezok = $Sor.PSObject.Properties.Value | Where-Object {
        -not [string]::IsNullOrWhiteSpace([string]$_)
    }

    return (($kitoltottMezok | Measure-Object).Count -eq 0)
}

function Keres-OszlopMintaAlapjan {
    param(
        [string[]]$Oszlopok,
        [string]$Minta
    )

    return $Oszlopok |
        Where-Object { (Tisztit-Szoveg $_) -like "$Minta*" } |
        Select-Object -First 1
}

function Get-Median {
    param([int[]]$Ertekek)

    if ($Ertekek.Count -eq 0) {
        return $null
    }

    $rendezett = $Ertekek | Sort-Object
    $kozep = [int][Math]::Floor($rendezett.Count / 2)

    if ($rendezett.Count % 2 -eq 1) {
        return [double]$rendezett[$kozep]
    }

    return [Math]::Round((($rendezett[$kozep - 1] + $rendezett[$kozep]) / 2), 2)
}

function Get-Modusz {
    param([int[]]$Ertekek)

    if ($Ertekek.Count -eq 0) {
        return ""
    }

    return ($Ertekek |
        Group-Object |
        Sort-Object -Property @{Expression = "Count"; Descending = $true}, Name |
        Select-Object -First 1).Name
}

function Get-Szoras {
    param([int[]]$Ertekek)

    if ($Ertekek.Count -le 1) {
        return 0
    }

    $atlag = ($Ertekek | Measure-Object -Average).Average
    $negyzetesElteresek = $Ertekek | ForEach-Object { [Math]::Pow(($_ - $atlag), 2) }
    $variancia = ($negyzetesElteresek | Measure-Object -Sum).Sum / ($Ertekek.Count - 1)
    return [Math]::Round([Math]::Sqrt($variancia), 2)
}

function Get-Ertekek {
    param(
        [string]$Orszag,
        [object[]]$Sorok,
        [string[]]$Oszlopok,
        [string]$Minta
    )

    $oszlop = Keres-OszlopMintaAlapjan $Oszlopok $Minta
    if (-not $oszlop) {
        throw "Nem található értékállítás oszlop ezzel a mintával: $Minta"
    }

    return $Sorok |
        Where-Object { -not (Test-UresSor $_) } |
        ForEach-Object {
            $valasz = Tisztit-Szoveg $_.$oszlop
            if ($valasz -match "^[1-6]") {
                [int]$matches[0]
            }
        }
}

function Normalizal-IgenNemTalán {
    param([string]$Ertek)

    $x = Tisztit-Szoveg $Ertek

    switch -Wildcard ($x) {
        "Yes" { return "Igen" }
        "No" { return "Nem" }
        "Maybe" { return "Talán" }
        "Da" { return "Igen" }
        "Nu" { return "Nem" }
        "Poate" { return "Talán" }
        default {
            if ([string]::IsNullOrWhiteSpace($x)) { return "(üres)" }
            return $x
        }
    }
}

function Test-NemValasz {
    param([string]$Ertek)

    return ((Normalizal-IgenNemTalán $Ertek) -eq "Nem")
}

function Get-TobbvalaszosOpcioDarab {
    param(
        [object[]]$Sorok,
        [string]$Oszlop,
        [string[]]$Mintak
    )

    return ($Sorok |
        Where-Object { -not (Test-UresSor $_) } |
        Where-Object {
            $valasz = Tisztit-Szoveg $_.$Oszlop
            $talalat = $false
            foreach ($minta in $Mintak) {
                if ($valasz -like "*$minta*") {
                    $talalat = $true
                    break
                }
            }
            $talalat
        } |
        Measure-Object).Count
}

function Add-TudasSor {
    param(
        [System.Collections.Generic.List[object]]$Lista,
        [string]$Orszag,
        [string]$Tema,
        [string]$Kod,
        [string]$Kerdes,
        [string]$Valasz,
        [int]$Darab,
        [int]$Kitoltok
    )

    $Lista.Add([pscustomobject]@{
        Orszag = $Orszag
        Tema = $Tema
        Kod = $Kod
        Kerdes = $Kerdes
        Valasz = $Valasz
        Darab = $Darab
        Szazalek = if ($Kitoltok -gt 0) { [Math]::Round(($Darab / $Kitoltok) * 100, 1) } else { "" }
    })
}

function Add-ReszletesSor {
    param(
        [System.Collections.Generic.List[object]]$Lista,
        [string]$Orszag,
        [string]$Kod,
        [string]$Allitas,
        [string]$Mutato,
        [string]$Ertek
    )

    $Lista.Add([pscustomobject]@{
        Orszag = $Orszag
        Kod = $Kod
        Allitas = $Allitas
        Mutato = $Mutato
        Ertek = $Ertek
    })
}

$romaniaSorok = Import-Csv -Path $romaniaFajl -Encoding UTF8
$hollandiaSorok = Import-Csv -Path $hollandiaFajl -Encoding UTF8
$romaniaOszlopok = $romaniaSorok[0].PSObject.Properties.Name
$hollandiaOszlopok = $hollandiaSorok[0].PSObject.Properties.Name

$reszletes = [System.Collections.Generic.List[object]]::new()
$osszefoglalo = [System.Collections.Generic.List[object]]::new()

foreach ($orszagAdat in @(
    [pscustomobject]@{ Orszag = "Románia"; Sorok = $romaniaSorok; Oszlopok = $romaniaOszlopok; MintaMezo = "RomaniaMinta" },
    [pscustomobject]@{ Orszag = "Hollandia"; Sorok = $hollandiaSorok; Oszlopok = $hollandiaOszlopok; MintaMezo = "HollandiaMinta" }
)) {
    foreach ($allitas in $allitasok) {
        $ertekek = @(Get-Ertekek $orszagAdat.Orszag $orszagAdat.Sorok $orszagAdat.Oszlopok $allitas.($orszagAdat.MintaMezo))
        $n = $ertekek.Count
        $atlag = if ($n -gt 0) { [Math]::Round(($ertekek | Measure-Object -Average).Average, 2) } else { "" }
        $median = Get-Median $ertekek
        $modus = Get-Modusz $ertekek
        $szoras = Get-Szoras $ertekek

        $darabok = @{}
        for ($i = 1; $i -le 6; $i++) {
            $darabok[$i] = ($ertekek | Where-Object { $_ -eq $i } | Measure-Object).Count
        }

        $osszefoglalo.Add([pscustomobject]@{
            Orszag = $orszagAdat.Orszag
            Kod = $allitas.Kod
            Tema = $allitas.Tema
            Allitas = $allitas.RovidNev
            Kitoltok = $n
            Atlag = $atlag
            Median = $median
            Modusz = $modus
            Szoras = $szoras
            "1_darab" = $darabok[1]
            "2_darab" = $darabok[2]
            "3_darab" = $darabok[3]
            "4_darab" = $darabok[4]
            "5_darab" = $darabok[5]
            "6_darab" = $darabok[6]
            "5_6_egyutt_darab" = $darabok[5] + $darabok[6]
            "5_6_egyutt_szazalek" = if ($n -gt 0) { [Math]::Round((($darabok[5] + $darabok[6]) / $n) * 100, 1) } else { "" }
        })

        Add-ReszletesSor $reszletes $orszagAdat.Orszag $allitas.Kod "$($allitas.Tema) - $($allitas.RovidNev)" "Kitöltők száma" $n
        Add-ReszletesSor $reszletes $orszagAdat.Orszag $allitas.Kod "$($allitas.Tema) - $($allitas.RovidNev)" "Átlag" $atlag
        Add-ReszletesSor $reszletes $orszagAdat.Orszag $allitas.Kod "$($allitas.Tema) - $($allitas.RovidNev)" "Medián" $median
        Add-ReszletesSor $reszletes $orszagAdat.Orszag $allitas.Kod "$($allitas.Tema) - $($allitas.RovidNev)" "Módusz" $modus
        Add-ReszletesSor $reszletes $orszagAdat.Orszag $allitas.Kod "$($allitas.Tema) - $($allitas.RovidNev)" "Szórás" $szoras
        for ($i = 1; $i -le 6; $i++) {
            Add-ReszletesSor $reszletes $orszagAdat.Orszag $allitas.Kod "$($allitas.Tema) - $($allitas.RovidNev)" "$i válasz darab" $darabok[$i]
        }
        Add-ReszletesSor $reszletes $orszagAdat.Orszag $allitas.Kod "$($allitas.Tema) - $($allitas.RovidNev)" "5-6 válasz együtt darab" ($darabok[5] + $darabok[6])
        $magasValaszSzazalek = if ($n -gt 0) { [Math]::Round((($darabok[5] + $darabok[6]) / $n) * 100, 1) } else { "" }
        Add-ReszletesSor $reszletes $orszagAdat.Orszag $allitas.Kod "$($allitas.Tema) - $($allitas.RovidNev)" "5-6 válasz együtt százalék" $magasValaszSzazalek
    }
}

$tudasOsszesites = [System.Collections.Generic.List[object]]::new()

$okostelefonOpcioMintak = @(
    [pscustomobject]@{
        Valasz = "Kidobom a normál háztartási szemétbe"
        Mintak = @("háztartási szemét", "normal household waste", "menajer")
    },
    [pscustomobject]@{
        Valasz = "Kidobom a műanyag vagy papír szelektív gyűjtőbe"
        Mintak = @("műanyag", "papír szelektív", "plastic or paper", "plastic", "hârtie")
    },
    [pscustomobject]@{
        Valasz = "Leadom kijelölt e-hulladékgyűjtő ponton"
        Mintak = @("elektromos hulladékgyűjtő", "e-waste collection", "punct de colectare")
    },
    [pscustomobject]@{
        Valasz = "Visszaviszem az üzletbe"
        Mintak = @("üzletbe", "store", "magazin")
    },
    [pscustomobject]@{
        Valasz = "Eladom vagy odaadom valakinek"
        Mintak = @("Eladom", "selling", "give it to someone", "vând", "dau cuiva")
    },
    [pscustomobject]@{
        Valasz = "Megjavíttatom, ha lehetséges"
        Mintak = @("Megjavíttatom", "repaired", "repar")
    },
    [pscustomobject]@{
        Valasz = "Elteszem a fiókba"
        Mintak = @("fiók", "drawer", "sertar")
    },
    [pscustomobject]@{
        Valasz = "Leadom mobilszolgáltatónál"
        Mintak = @("mobilszolgáltató", "mobile service provider", "operator")
    },
    [pscustomobject]@{
        Valasz = "Nem tudom"
        Mintak = @("Nem tudom", "don't know", "I do not know", "Nu știu", "Nu stiu")
    }
)

foreach ($orszagAdat in @(
    [pscustomobject]@{ Orszag = "Románia"; Sorok = $romaniaSorok; Oszlopok = $romaniaOszlopok; Q5 = "5. Mit lehet tenni"; Q6 = "6. Hallottál"; Q7 = "7. Vettél már részt"; Q8 = "8. Amennyiben" },
    [pscustomobject]@{ Orszag = "Hollandia"; Sorok = $hollandiaSorok; Oszlopok = $hollandiaOszlopok; Q5 = "5. What can you do"; Q6 = "6. Have you ever heard"; Q7 = "7. Have you ever participated"; Q8 = "8. If you answered" }
)) {
    $validSorok = @($orszagAdat.Sorok | Where-Object { -not (Test-UresSor $_) })
    $kitoltok = $validSorok.Count

    $q5Oszlop = Keres-OszlopMintaAlapjan $orszagAdat.Oszlopok $orszagAdat.Q5
    foreach ($opcio in $okostelefonOpcioMintak) {
        $darab = Get-TobbvalaszosOpcioDarab $validSorok $q5Oszlop $opcio.Mintak
        Add-TudasSor $tudasOsszesites $orszagAdat.Orszag "Tudás" "T1" "Mit lehet tenni egy elromlott, már nem használt okostelefonnal?" $opcio.Valasz $darab $kitoltok
    }

    foreach ($kerdes in @(
        [pscustomobject]@{ Tema = "Tudás"; Kod = "T2"; Minta = $orszagAdat.Q6; Nev = 'Hallott-e már az "e-hulladék" vagy WEEE fogalmáról?'; Felteteles = $false },
        [pscustomobject]@{ Tema = "Attitűd az edukáció felé"; Kod = "A1"; Minta = $orszagAdat.Q7; Nev = "Részt vett-e már e-hulladék edukációs programon vagy kezdeményezésen?"; Felteteles = $false },
        [pscustomobject]@{ Tema = "Attitűd az edukáció felé"; Kod = "A2"; Minta = $orszagAdat.Q8; Nev = "A 7. kérdésre nemmel válaszolók szívesen részt vennének-e hasonló eseményen?"; Felteteles = $true }
    )) {
        $oszlop = Keres-OszlopMintaAlapjan $orszagAdat.Oszlopok $kerdes.Minta
        $kerdesSorok = $validSorok

        if ($kerdes.Felteteles) {
            $q7Oszlop = Keres-OszlopMintaAlapjan $orszagAdat.Oszlopok $orszagAdat.Q7
            $kerdesSorok = @($validSorok | Where-Object { Test-NemValasz $_.$q7Oszlop })
        }

        $kerdesKitoltok = $kerdesSorok.Count
        $normalizaltValaszok = $kerdesSorok | ForEach-Object { Normalizal-IgenNemTalán $_.$oszlop }
        foreach ($csoport in ($normalizaltValaszok | Group-Object | Sort-Object -Property @{Expression = "Count"; Descending = $true}, Name)) {
            Add-TudasSor $tudasOsszesites $orszagAdat.Orszag $kerdes.Tema $kerdes.Kod $kerdes.Nev $csoport.Name $csoport.Count $kerdesKitoltok
        }
    }
}

$osszefoglalo | Export-Csv -Path $osszefoglaloCsv -NoTypeInformation -Encoding UTF8
$reszletes | Export-Csv -Path $reszletesCsv -NoTypeInformation -Encoding UTF8
$tudasOsszesites | Export-Csv -Path $tudasCsv -NoTypeInformation -Encoding UTF8
$tudasOsszesites | Export-Csv -Path $tudasReszletesCsv -NoTypeInformation -Encoding UTF8

$txt = [System.Collections.Generic.List[string]]::new()
foreach ($orszag in @("Románia", "Hollandia")) {
    $txt.Add("")
    $txt.Add("=== $orszag ===")
    foreach ($sor in ($osszefoglalo | Where-Object { $_.Orszag -eq $orszag })) {
        $txt.Add("")
        $txt.Add("$($sor.Kod) - $($sor.Tema): $($sor.Allitas)")
        $txt.Add("  Kitöltők: $($sor.Kitoltok)")
        $txt.Add("  Átlag: $($sor.Atlag)")
        $txt.Add("  Medián: $($sor.Median)")
        $txt.Add("  Módusz: $($sor.Modusz)")
        $txt.Add("  Szórás: $($sor.Szoras)")
        $txt.Add("  1-6 darabszám: $($sor.'1_darab'), $($sor.'2_darab'), $($sor.'3_darab'), $($sor.'4_darab'), $($sor.'5_darab'), $($sor.'6_darab')")
        $txt.Add("  5-6 együtt: $($sor.'5_6_egyutt_darab') fő ($($sor.'5_6_egyutt_szazalek')%)")
    }

    $txt.Add("")
    $txt.Add("--- Tudás és edukációs attitűd ---")
    foreach ($kerdesCsoport in (($tudasOsszesites | Where-Object { $_.Orszag -eq $orszag }) | Group-Object Kod, Kerdes)) {
        $elso = $kerdesCsoport.Group[0]
        $txt.Add("")
        $txt.Add("$($elso.Kod) - $($elso.Tema): $($elso.Kerdes)")
        foreach ($sor in ($kerdesCsoport.Group | Sort-Object -Property @{Expression = "Darab"; Descending = $true}, Valasz)) {
            $txt.Add("  $($sor.Valasz): $($sor.Darab) fő ($($sor.Szazalek)%)")
        }
    }
}

$txt | Set-Content -Path $szovegesTxt -Encoding UTF8
$txt | Write-Output

Write-Output ""
Write-Output "Összefoglaló tábla mentve: $osszefoglaloCsv"
Write-Output "Részletes tábla mentve: $reszletesCsv"
Write-Output "Tudás és edukációs attitűd tábla mentve: $tudasCsv"
Write-Output "Szöveges összefoglaló mentve: $szovegesTxt"




