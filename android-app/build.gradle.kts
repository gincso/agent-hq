plugins {
    id("com.android.application") version "8.1.0" apply true
    id("org.jetbrains.kotlin.android") version "1.9.23" apply true
    kotlin("kapt") version "1.9.23" apply true
}

android {
    namespace "com.agenthq.app"
    compileSdk 34

    defaultConfig {
        applicationId "com.agenthq.app"
        minSdk 21
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles(getDefaultProguardFile("androidx.progurard.core.recommended"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "1.17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.14.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.0")
    implementation("androidx.activity:activity-ktx:1.7.2")
    implementation("androidx.fragment:fragment-ktx:1.6.2")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.constraintlayout:constraintlayout:2.19.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    // Room
    implementation("androidx.room:room-ktx:2.5.1")
    kapt("androidx.room:room-compiler:2.5.1")
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.0")
    // WebSocket
    implementation("org.java-websocket:Java-WebSocket:1.5.3")
}
