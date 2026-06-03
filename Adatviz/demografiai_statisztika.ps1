$ErrorActionPreference = "Stop"

$hollandiaFajl = "Hollandia.csv"
$romaniaFajl = "Románia.csv"
$kimenetiCsv = "demografiai_statisztika.csv"
$kimenetiTxt = "demografiai_statisztika.txt"

function Tisztit-Szoveg {
    param([string]$Ertek)

    if ([string]::IsNullOrWhiteSpace($Ertek)) {
        return ""
    }

    $szoveg = $Ertek.Trim()
    $szoveg = $szoveg -replace [string][char]0xFEFF, ""
    $szoveg = $szoveg -replace "\s+", " "
    return $szoveg.Trim()
}

function Keres-Oszlop {
    param(
        [string[]]$Oszlopok,
        [string[]]$LehetsegesNevek
    )

    foreach ($nev in $LehetsegesNevek) {
        $talalat = $Oszlopok | Where-Object { (Tisztit-Szoveg $_).ToLower() -eq (Tisztit-Szoveg $nev).ToLower() } | Select-Object -First 1
        if ($talalat) {
            return $talalat
        }
    }

    return $null
}

function Magyarit-Nem {
    param([string]$Ertek)
    $x = Tisztit-Szoveg $Ertek

    switch -Wildcard ($x) {
        "Man" { return "Férfi" }
        "Woman" { return "Nő" }
        "Femeie" { return "Nő" }
        "Bărbat" { return "Férfi" }
        "Other*" { return "Egyéb / Nem kívánok válaszolni" }
        default { return $x }
    }
}

function Magyarit-Kor {
    param([string]$Ertek)
    $x = Tisztit-Szoveg $Ertek

    $x = $x -replace " years", " év"
    $x = $x -replace " de ani", " év"
    return $x
}

function Magyarit-Vegzettseg {
    param([string]$Ertek)
    $x = Tisztit-Szoveg $Ertek

    switch -Wildcard ($x) {
        "High School" { return "Középiskola / Érettségi" }
        "Liceu*" { return "Középiskola / Érettségi" }
        "Vocational*" { return "Szakképesítés" }
        "College*" { return "Főiskola / Egyetemi diploma (BA/BSc)" }
        "Licen*" { return "Főiskola / Egyetemi diploma (BA/BSc)" }
        "Master*" { return "Mesterképzés vagy magasabb (MA/MSc/PhD)" }
        default { return $x }
    }
}

function Magyarit-Foglalkozas {
    param([string]$Ertek)
    $x = Tisztit-Szoveg $Ertek

    switch -Wildcard ($x) {
        "Student" { return "Tanuló / Hallgató" }
        "Student / Elev" { return "Tanuló / Hallgató" }
        "Employee" { return "Alkalmazott" }
        "Angajat" { return "Alkalmazott" }
        "Entrepreneur" { return "Vállalkozó" }
        "Antreprenor" { return "Vállalkozó" }
        "Unemployed*" { return "Munkanélküli / Álláskereső" }
        "Household worker" { return "Háztartásbeli" }
        default { return ($x -replace "Vállakkozó", "Vállalkozó") }
    }
}

function Magyarit-Lakohely {
    param([string]$Ertek)
    $x = Tisztit-Szoveg $Ertek

    switch -Wildcard ($x) {
        "Large city*" { return "Nagyváros (100 000 lakos fölött)" }
        "Oraș mare*" { return "Nagyváros (100 000 lakos fölött)" }
        "City*" { return "Város (20 000 - 100 000 lakos)" }
        "Oraș (*" { return "Város (20 000 - 100 000 lakos)" }
        "Small Town*" { return "Kisváros / Község (20 000 lakos alatt)" }
        "Kisváros*" { return "Kisváros / Község (20 000 lakos alatt)" }
        "Rural*" { return "Vidéki terület / falu" }
        "Zonă rurală*" { return "Vidéki terület / falu" }
        default { return $x }
    }
}

function Magyarit-Jovedelem {
    param([string]$Ertek)
    $x = Tisztit-Szoveg $Ertek

    if ([string]::IsNullOrWhiteSpace($x)) { return "" }
    if ($x -like "I do not*" -or $x -like "Nu doresc*" -or $x -like "Nem kívánok*") { return "Nem kívánok válaszolni" }
    if ($x -like "under*" -or $x -like "600 € alatt") { return "600 EUR alatt" }
    if ($x -like "above*" -or $x -like "Peste*" -or $x -like "2 400 € felett") { return "2 400 EUR felett" }
    if ($x -match "600.*1") { return "600-1 000 EUR" }
    if ($x -match "1.?001.*1.?600") { return "1 001-1 600 EUR" }
    if ($x -match "1.?601.*2.?400") { return "1 601-2 400 EUR" }

    return $x
}

function Magyarit-HaztartasMeret {
    param([string]$Ertek)
    $x = Tisztit-Szoveg $Ertek

    switch -Wildcard ($x) {
        "1 person*" { return "1 fő (egyedül élek)" }
        "1 persoan*" { return "1 fő (egyedül élek)" }
        "2 people" { return "2 fő" }
        "2 persoane" { return "2 fő" }
        "3-4 people" { return "3-4 fő" }
        "3-4 persoane" { return "3-4 fő" }
        "5 or more*" { return "5 vagy több fő" }
        default { return $x }
    }
}

function Get-SorNyelve {
    param($Sor)

    $teljesSzoveg = (($Sor.PSObject.Properties.Value | Where-Object { $_ }) -join " | ")
    $romanMintak = @("Femeie", "Bărbat", "de ani", "Liceu", "Licență", "Masterat", "Angajat", "Antreprenor", "Student / Elev", "Oraș", "Zonă rurală", "persoane", "persoană", "Nu doresc", "Peste")
    $magyarMintak = @("Nő", "Férfi", " év", "Középiskola", "Főiskola", "Mesterképzés", "Szakképesítés", "Tanuló", "Alkalmazott", "Vállalkozó", "Vállakkozó", "Nagyváros", "Város", "Vidéki", " fő", "Nem kívánok")

    $romanPont = ($romanMintak | Where-Object { $teljesSzoveg -like "*$_*" }).Count
    $magyarPont = ($magyarMintak | Where-Object { $teljesSzoveg -like "*$_*" }).Count

    if ($romanPont -gt $magyarPont) { return "Román nyelvű romániai kitöltők" }
    if ($magyarPont -gt 0) { return "Magyar nyelvű romániai kitöltők" }
    return "Nyelv szerint nem eldönthető romániai kitöltők"
}

function Test-UresSor {
    param($Sor)

    $kitoltottMezok = $Sor.PSObject.Properties.Value | Where-Object {
        -not [string]::IsNullOrWhiteSpace([string]$_)
    }

    return (($kitoltottMezok | Measure-Object).Count -eq 0)
}

function Normalizalt-Sorok {
    $eredmeny = @()

    $hollandSorok = Import-Csv -Path $hollandiaFajl -Encoding UTF8
    $hollandOszlopok = $hollandSorok[0].PSObject.Properties.Name
    $hollandMap = @{
        Nem = Keres-Oszlop $hollandOszlopok @("Gender:")
        Kor = Keres-Oszlop $hollandOszlopok @("Age:")
        Vegzettseg = Keres-Oszlop $hollandOszlopok @("Highest level of finished education:")
        Foglalkozas = Keres-Oszlop $hollandOszlopok @("Current occupation:")
        Lakohely = Keres-Oszlop $hollandOszlopok @("Place of residence:")
        Jovedelem = Keres-Oszlop $hollandOszlopok @("Your household's monthly net income (in EUR)")
        Haztartas = Keres-Oszlop $hollandOszlopok @("Your household size")
    }

    foreach ($sor in $hollandSorok) {
        if (Test-UresSor $sor) { continue }

        $eredmeny += [pscustomobject]@{
            Csoport = "Holland kitöltők (angol nyelvű)"
            Orszag = "Hollandia"
            Nem = Magyarit-Nem $sor.($hollandMap.Nem)
            Kor = Magyarit-Kor $sor.($hollandMap.Kor)
            Vegzettseg = Magyarit-Vegzettseg $sor.($hollandMap.Vegzettseg)
            Foglalkozas = Magyarit-Foglalkozas $sor.($hollandMap.Foglalkozas)
            Lakohely = Magyarit-Lakohely $sor.($hollandMap.Lakohely)
            Jovedelem = Magyarit-Jovedelem $sor.($hollandMap.Jovedelem)
            Haztartas = Magyarit-HaztartasMeret $sor.($hollandMap.Haztartas)
        }
    }

    $romaniaSorok = Import-Csv -Path $romaniaFajl -Encoding UTF8
    $romaniaOszlopok = $romaniaSorok[0].PSObject.Properties.Name
    $romaniaMap = @{
        Nem = Keres-Oszlop $romaniaOszlopok @("Neme:")
        Kor = Keres-Oszlop $romaniaOszlopok @("Kora:")
        Vegzettseg = Keres-Oszlop $romaniaOszlopok @("Legmagasabb iskolai végzettsége:")
        Foglalkozas = Keres-Oszlop $romaniaOszlopok @("Jelenlegi foglalkozása:")
        Lakohely = Keres-Oszlop $romaniaOszlopok @("Lakóhelye:")
        Jovedelem = Keres-Oszlop $romaniaOszlopok @("Háztartásának havi nettó jövedelme (Euróban):")
        Haztartas = Keres-Oszlop $romaniaOszlopok @("Háztartásának mérete:")
    }

    foreach ($sor in $romaniaSorok) {
        if (Test-UresSor $sor) { continue }

        $eredmeny += [pscustomobject]@{
            Csoport = Get-SorNyelve $sor
            Orszag = "Románia"
            Nem = Magyarit-Nem $sor.($romaniaMap.Nem)
            Kor = Magyarit-Kor $sor.($romaniaMap.Kor)
            Vegzettseg = Magyarit-Vegzettseg $sor.($romaniaMap.Vegzettseg)
            Foglalkozas = Magyarit-Foglalkozas $sor.($romaniaMap.Foglalkozas)
            Lakohely = Magyarit-Lakohely $sor.($romaniaMap.Lakohely)
            Jovedelem = Magyarit-Jovedelem $sor.($romaniaMap.Jovedelem)
            Haztartas = Magyarit-HaztartasMeret $sor.($romaniaMap.Haztartas)
        }
    }

    return $eredmeny
}

function Add-Osszesites {
    param(
        [System.Collections.Generic.List[object]]$Lista,
        [string]$Csoport,
        [string]$Mezo,
        [string]$Ertek,
        [int]$Darab
    )

    $Lista.Add([pscustomobject]@{
        Csoport = $Csoport
        Mezo = $Mezo
        Ertek = $Ertek
        Darab = $Darab
    })
}

$adatok = Normalizalt-Sorok
$osszesites = [System.Collections.Generic.List[object]]::new()

$csoportok = @(
    "Magyar nyelvű romániai kitöltők",
    "Román nyelvű romániai kitöltők",
    "Nyelv szerint nem eldönthető romániai kitöltők",
    "Romániai kitöltők összesen",
    "Holland kitöltők (angol nyelvű)",
    "Teljes minta"
)

$mezok = [ordered]@{
    Nem = "Nem"
    Kor = "Kor"
    Vegzettseg = "Legmagasabb iskolai végzettség"
    Foglalkozas = "Jelenlegi foglalkozás"
    Lakohely = "Lakóhely"
    Jovedelem = "Háztartás havi nettó jövedelme"
    Haztartas = "Háztartás mérete"
}

foreach ($csoport in $csoportok) {
    if ($csoport -eq "Romániai kitöltők összesen") {
        $sorok = $adatok | Where-Object { $_.Orszag -eq "Románia" }
    }
    elseif ($csoport -eq "Teljes minta") {
        $sorok = $adatok
    }
    else {
        $sorok = $adatok | Where-Object { $_.Csoport -eq $csoport }
    }

    if (($sorok | Measure-Object).Count -eq 0) {
        continue
    }

    Add-Osszesites $osszesites $csoport "Kitöltők száma" "Összesen" (($sorok | Measure-Object).Count)

    foreach ($mezoKulcs in $mezok.Keys) {
        $mezoNev = $mezok[$mezoKulcs]
        $sorok |
            Group-Object -Property $mezoKulcs |
            Sort-Object -Property @{Expression = "Count"; Descending = $true}, Name |
            ForEach-Object {
                $ertek = if ([string]::IsNullOrWhiteSpace($_.Name)) { "(üres)" } else { $_.Name }
                Add-Osszesites $osszesites $csoport $mezoNev $ertek $_.Count
            }
    }
}

$osszesites | Export-Csv -Path $kimenetiCsv -NoTypeInformation -Encoding UTF8

$szovegesKimenet = [System.Collections.Generic.List[string]]::new()
foreach ($csoport in $csoportok) {
    $csoportSorok = $osszesites | Where-Object { $_.Csoport -eq $csoport }
    if (($csoportSorok | Measure-Object).Count -eq 0) {
        continue
    }

    $szovegesKimenet.Add("")
    $szovegesKimenet.Add("=== $csoport ===")
    foreach ($mezo in @("Kitöltők száma") + $mezok.Values) {
        $szovegesKimenet.Add("")
        $szovegesKimenet.Add($mezo)
        $csoportSorok |
            Where-Object { $_.Mezo -eq $mezo } |
            ForEach-Object { $szovegesKimenet.Add("  $($_.Ertek): $($_.Darab)") }
    }
}

$szovegesKimenet | Set-Content -Path $kimenetiTxt -Encoding UTF8
$szovegesKimenet | Write-Output

Write-Output ""
Write-Output "CSV mentve: $kimenetiCsv"
Write-Output "Szöveges összesítés mentve: $kimenetiTxt"


