import('crypto');

KeyString = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAxXmG6EzBThUQ+/pAJkJv
LDmUdmSJYJIVsRrR0AhJyZFHYzkg2ljTDz9OZiY2kacyVSUp3mZ599dYCythknkH
I8ctdkUvU79Y0QaGCIF4anq4n0Gp9Tr+6pEcuxoZD19yhXh+KwbGA6FETQ/F43j/
keaA3R699yjd7dpeuY/76QYRGEajsKPhVCCPqc4BOv/DwTy1DbkneweqycY/6vbu
3w/hU+XqkJmWXcyWH8D4617nL0v3v2xwLw1yEAsy4g+Q2Bd7Ul4FHOZPOblh2dD+
0bhVkU6vry9v4Rmdb513efESLtSJxnRqhiEys8UXFpJVKpXo0SYrP8qwUsITyW20
WBQfBIqb+hRLIVvYv2cZze9gnM+Nk9cDTJkZYuqV1cr0ZZlYGDxl33FsyMvfWdqr
vNaVkE8y2czUJD9ljX8K8yPJh52awz3kroiu1oi7X1mvy9qwURZZc6EeGoJ9pNnI
qpejHyknGif27pxhiiB7UqpYfYoWpg7xX0SleHcwr8CjnbTG3xGmPh18gknVsjmo
uiatcM7oXiLxpH5pUObLucc1LxVR1VP34SmSota1zKM00cU3jXe92fhFnlmOH9mt
8Or71TiZGiSdaMpGU8ABi/3NH/rro11pCTJr6u2W1iBW/X0g1iLUm5YkrZUdMWjf
6eQrowDPCS5mEAUZ+Ep/L1ECAwEAAQ==
-----END PUBLIC KEY-----`


const crypto = require('crypto');



crypto.createPublicKey(KeyString)

console.log(crypto.getHashes())









