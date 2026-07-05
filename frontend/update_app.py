import pathlib

app_file = pathlib.Path(r"e:\govui\frontend\src\App.jsx")
content = app_file.read_text(encoding="utf-8")

updated = content.replace(
    "import ParticleBackground from './components/ParticleBackground'",
    "import ParticleBackground from './components/ParticleBackground'\nimport LanguageSelector from './components/LanguageSelector'"
)

updated = updated.replace(
    "<ParticleBackground />",
    "<ParticleBackground />\n      <LanguageSelector />"
)

app_file.write_text(updated, encoding="utf-8")
print("Done")
