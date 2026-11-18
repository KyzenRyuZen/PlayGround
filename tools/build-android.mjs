// One-command Android debug APK: web build -> Capacitor sync -> Gradle.
// Usage: npm run android:apk
//
// Requires Node 20+, an Android SDK (ANDROID_HOME) and a JDK 21 (or 17).
// The resulting APK is debug-signed and installable with `adb install`.
import { spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const isWin = process.platform === 'win32';

function run(command, args, cwd, env = {}) {
  console.log(`\n$ ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: isWin,
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    console.error(`\nCommand failed with exit code ${result.status ?? 'unknown'}.`);
    process.exit(result.status || 1);
  }
}

// Gradle 8/9 works with JDK 17 and 21; some newer JDKs are rejected by the
// Android Gradle plugin. Prefer an explicit JAVA_HOME, then the usual paths.
function findJavaHome() {
  if (process.env.JAVA_HOME && existsSync(process.env.JAVA_HOME)) return process.env.JAVA_HOME;
  const candidates = isWin
    ? ['C:\\Program Files\\Android\\Android Studio\\jbr']
    : [
        '/usr/lib/jvm/temurin-21-jdk-amd64',
        '/usr/lib/jvm/temurin-17-jdk-amd64',
        '/usr/lib/jvm/java-21-openjdk-amd64',
        '/usr/lib/jvm/java-17-openjdk-amd64',
        '/opt/homebrew/opt/openjdk@21',
        '/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home',
      ];
  return candidates.find((path) => existsSync(path)) ?? null;
}

if (!process.env.ANDROID_HOME && !process.env.ANDROID_SDK_ROOT) {
  console.warn('Warning: ANDROID_HOME / ANDROID_SDK_ROOT is not set. Gradle may not find the SDK.');
}

const javaHome = findJavaHome();
if (!javaHome) {
  console.error('No JDK found. Set JAVA_HOME to a JDK 17 or 21 installation and retry.');
  process.exit(1);
}
console.log(`Using JAVA_HOME=${javaHome}`);

run(process.execPath, [join(root, 'tools/build-web.mjs')], root);
run(isWin ? 'npx.cmd' : 'npx', ['cap', 'sync', 'android'], root);

const gradle = join(root, 'android', isWin ? 'gradlew.bat' : 'gradlew');
if (!existsSync(gradle)) {
  console.error('android/gradlew is missing. Run `npx cap add android` once to scaffold the project.');
  process.exit(1);
}
run(gradle, ['assembleDebug', '--no-daemon'], join(root, 'android'), { JAVA_HOME: javaHome });

const apk = join(root, 'android/app/build/outputs/apk/debug/app-debug.apk');
if (existsSync(apk)) {
  const mb = (statSync(apk).size / (1024 * 1024)).toFixed(1);
  console.log(`\nInstallable APK: ${apk} (${mb} MB)`);
  console.log('Install on a connected device: adb install -r android/app/build/outputs/apk/debug/app-debug.apk');
} else {
  console.error('\nGradle finished but the APK was not found.');
  process.exit(1);
}
