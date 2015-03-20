function addScheduleTimesToSpin(previousSpin, spinToSchedule) {
// IF CURRENT SPIN IS A SONG
  // IF PREVIOUS SPIN WAS A SONG
    // ** START AT PREVIOUS EOM
  // ELSE IF PREVIOUS SPIN WAS A COMMENTARY
    // IF commentary can extend into spin long enough
      // previousSpin duration - EOI
    // ELSE
      // Couple it to song preceding the commentary
    // ENDIF
    // ** Start PREVIOUS DURATION - BOO
  // ELSE IF PREVIOUS SPIN WAS A COMMERCIAL BLOCK
    // start after previous duration

// ELSE IF CURRENT SPIN IS A COMMENTARY
  // IF PREVIOUS SPIN WAS A SONG
    // IF Commentary duration will outlast EOM
      // start at previousSpin BOO
      // write previousSpinOverlap
    // ELSE (commentary not long enough to cover)
      // start at previousSpin EOM
      // write previousSpinOverlap
  // ELSE PREVIOUS SPIN WAS A COMMENTARY OR COMMERCIAL BLOCK
    // start at total end of previous spin
    // previousSpinOverlap is 0
  // ENDIF 

// ELSE IF CURRENT SPIN IS A COMMERCIAL BLOCK
  // START AT EOM no matter what previous spin was
// ENDIF
}
