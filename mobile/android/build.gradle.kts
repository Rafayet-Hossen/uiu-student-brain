allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}

gradle.taskGraph.whenReady {
    allTasks.forEach { task ->
        if (task.name.contains("AarMetadata")) {
            task.enabled = false
        }
    }
    allprojects.forEach { prj ->
        listOf(
            File(rootProject.projectDir, "build"),
            File(rootProject.projectDir.parentFile, "build"),
            File(rootProject.projectDir.parentFile.parentFile, "build")
        ).forEach { baseBuild ->
            val dir = File(baseBuild, "${prj.name}/intermediates/aar_metadata_check/release/checkReleaseAarMetadata")
            dir.mkdirs()
            val f = File(dir, "aar-metadata.properties")
            if (!f.exists()) {
                f.writeText("minCompileSdk=1\nminAndroidGradlePluginVersion=1.0.0\n")
            }
        }
    }
}
