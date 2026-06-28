mkdir -p .next/standalone/.next/static .next/standalone/public
cp -r .next/static/. .next/standalone/.next/static/
cp -r public/. .next/standalone/public/
echo "Assets copied successfully"