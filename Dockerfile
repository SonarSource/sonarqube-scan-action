# HACK: Fix for "Error relocating /usr/bin/node: _ZSt28__throw_bad_array_new_lengthv: symbol not found" - https://github.com/nodejs/node/issues/41058#issuecomment-997348999
FROM alpine:3.16 as libstdc-donor
RUN apk add --update --no-cache --repository https://dl-cdn.alpinelinux.org/alpine/edge/main libstdc++

FROM sonarsource/sonar-scanner-cli:4.7

LABEL version="1.1.0" \
	repository="https://github.com/sonarsource/sonarqube-scan-action" \
	homepage="https://github.com/sonarsource/sonarqube-scan-action" \
	maintainer="SonarSource" \
	com.github.actions.name="SonarQube Scan" \
	com.github.actions.description="Scan your code with SonarQube to detect Bugs, Vulnerabilities and Code Smells in up to 27 programming languages!" \
	com.github.actions.icon="check" \
	com.github.actions.color="green"

# Install Python 3
RUN apk add --update --no-cache  \
    build-base \
    python3 \
    py3-pip
RUN python3 -m pip install --upgrade pip

# TODO: Install Ansible linter
#RUN pip3 install ansible-lint

# Upgrade Node.js
RUN apk add --update --no-cache --repository https://dl-cdn.alpinelinux.org/alpine/edge/main \
    nodejs \
    npm
RUN apk upgrade --no-cache --repository https://dl-cdn.alpinelinux.org/alpine/edge/main \
    nodejs \
    npm

# HACK: Fix for "Error relocating /usr/bin/node: _ZSt28__throw_bad_array_new_lengthv: symbol not found" - https://github.com/nodejs/node/issues/41058#issuecomment-997348999
COPY --from=libstdc-donor /usr/lib/libstdc++.so.6.0.29 /usr/lib/libstdc++.so.6.0.29
RUN rm /usr/lib/libstdc++.so.6 && ln -s /usr/lib/libstdc++.so.6.0.29 /usr/lib/libstdc++.so.6

# Install yarn
RUN apk add --update --no-cache \
    yarn

# Install PowerShell
# https://docs.microsoft.com/en-us/powershell/scripting/install/install-alpine?view=powershell-7.2#installation-steps
RUN apk add --update --no-cache \
    ca-certificates \
    less \
    ncurses-terminfo-base \
    krb5-libs \
    libgcc \
    libintl \
    libssl1.1 \
    libstdc++ \
    tzdata \
    userspace-rcu \
    zlib \
    icu-libs \
    curl

RUN apk add --update --no-cache --repository https://dl-cdn.alpinelinux.org/alpine/edge/main \
    lttng-ust

RUN wget -O powershell.tar.gz https://github.com/PowerShell/PowerShell/releases/download/v7.2.3/powershell-7.2.3-linux-alpine-x64.tar.gz; \
	mkdir -p /opt/microsoft/powershell/7; \
	tar zxf ./powershell.tar.gz -C /opt/microsoft/powershell/7; \
	chmod +x /opt/microsoft/powershell/7/pwsh; \
	ln -s /opt/microsoft/powershell/7/pwsh /usr/bin/pwsh

# Install PSScriptAnalyzer
SHELL ["pwsh", "-Command"]
RUN Set-PSRepository PSGallery -InstallationPolicy Trusted -Verbose; Install-Module PSScriptAnalyzer -Repository PSGallery -Scope AllUsers -Verbose

# Add Ingenio certificate to java keystore
COPY wildcard_corp_ingenio_com.pem .
RUN keytool -keystore /etc/ssl/certs/java/cacerts -storepass changeit -noprompt -trustcacerts -importcert -alias sonarqube -file wildcard_corp_ingenio_com.pem

# Fix line endings for entrypoint.sh
RUN apk add --no-cache \
    dos2unix
COPY entrypoint.sh /entrypoint.sh
RUN dos2unix /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
